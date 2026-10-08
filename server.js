// Dona Clara Emporio - servidor sem dependencias externas (Node >= 18)
const http = require('http'), fs = require('fs'), path = require('path');

// Le .env simples (sem biblioteca). Credenciais NUNCA ficam no codigo.
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach(l => {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  });
} catch {}
const PORT = process.env.PORT || 3000;
const ADMIN = process.env.ADMIN_PASSWORD;
const DB = path.join(__dirname, 'data', 'db.json');

const SEED = { orders: [], products: [
  { id: 1, name: 'Pão de fermentação natural', desc: 'Casca crocante, 48h de fermentação', price: 18, stock: 12, cat: 'Pães' },
  { id: 2, name: 'Pão colonial', desc: 'Macio, receita da casa', price: 12, stock: 20, cat: 'Pães' },
  { id: 3, name: 'Baguete artesanal', desc: 'Assada a cada manhã', price: 9, stock: 15, cat: 'Pães' },
  { id: 4, name: 'Croissant de manteiga', desc: 'Folhado, 27 camadas', price: 11, stock: 10, cat: 'Doces' },
  { id: 5, name: 'Bolo de cenoura com chocolate', desc: 'Serve 8 fatias', price: 58, stock: 4, cat: 'Doces' },
  { id: 6, name: 'Bolo de fubá cremoso', desc: 'Serve 8 fatias', price: 46, stock: 5, cat: 'Doces' },
  { id: 7, name: 'Tábua de frios (10 pessoas)', desc: 'Queijos, embutidos e geleias', price: 180, stock: 3, cat: 'Eventos' },
  { id: 8, name: 'Kit coffee break (20 pessoas)', desc: 'Pães, salgados, doces e café', price: 420, stock: 2, cat: 'Eventos' }
]};
fs.mkdirSync(path.dirname(DB), { recursive: true });
if (!fs.existsSync(DB)) fs.writeFileSync(DB, JSON.stringify(SEED, null, 2));
const load = () => JSON.parse(fs.readFileSync(DB, 'utf8'));
const save = d => fs.writeFileSync(DB, JSON.stringify(d, null, 2));

const send = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
const readBody = req => new Promise((ok, no) => { let b = ''; req.on('data', c => { b += c; if (b.length > 1e5) req.destroy(); }); req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch (e) { no(e); } }); });
const isAdmin = req => ADMIN && req.headers['x-admin-password'] === ADMIN;
const STATUS = ['Recebido', 'Em preparo', 'Pronto', 'Entregue', 'Cancelado'];
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname === '/api/products' && req.method === 'GET') return send(res, 200, load().products);

    if (url.pathname === '/api/orders' && req.method === 'POST') {
      const b = await readBody(req), db = load();
      const name = String(b.name || '').trim().slice(0, 80), phone = String(b.phone || '').replace(/\D/g, '');
      if (name.length < 2) return send(res, 400, { error: 'Informe seu nome.' });
      if (phone.length < 10 || phone.length > 11) return send(res, 400, { error: 'Informe um telefone com DDD.' });
      if (!['hoje', 'encomenda'].includes(b.type)) return send(res, 400, { error: 'Tipo de pedido inválido.' });
      const when = new Date(b.when);
      if (isNaN(when)) return send(res, 400, { error: 'Escolha data e horário de retirada.' });
      const minMs = (b.type === 'encomenda' ? 48 : 0) * 3600e3;
      if (when.getTime() < Date.now() + minMs - 60e3) return send(res, 400, { error: b.type === 'encomenda' ? 'Encomendas precisam de 48 horas de antecedência.' : 'Horário de retirada já passou.' });
      if (!Array.isArray(b.items) || !b.items.length) return send(res, 400, { error: 'Adicione pelo menos um item.' });
      const items = []; let total = 0;
      for (const it of b.items) {
        const p = db.products.find(x => x.id === it.id), q = Math.floor(Number(it.qty));
        if (!p || q < 1) return send(res, 400, { error: 'Item inválido.' });
        if (b.type === 'hoje' && p.cat === 'Eventos') return send(res, 400, { error: `"${p.name}" só pode ser encomendado com antecedência.` });
        if (b.type === 'hoje' && q > p.stock) return send(res, 409, { error: `Só restam ${p.stock} de "${p.name}".` });
        items.push({ id: p.id, name: p.name, qty: q, price: p.price }); total += p.price * q;
      }
      if (b.type === 'hoje') items.forEach(i => { db.products.find(p => p.id === i.id).stock -= i.qty; });
      const order = { code: 'DC' + String(db.orders.length + 1).padStart(4, '0'), name, phone, type: b.type, when: when.toISOString(), notes: String(b.notes || '').slice(0, 300), items, total, status: 'Recebido', createdAt: new Date().toISOString() };
      db.orders.push(order); save(db);
      return send(res, 201, order);
    }

    if (url.pathname === '/api/orders' && req.method === 'GET') {
      if (!isAdmin(req)) return send(res, 401, { error: 'Senha incorreta.' });
      return send(res, 200, load().orders.slice().reverse());
    }
    const m = url.pathname.match(/^\/api\/orders\/(DC\d+)$/);
    if (m && req.method === 'PATCH') {
      if (!isAdmin(req)) return send(res, 401, { error: 'Senha incorreta.' });
      const b = await readBody(req), db = load(), o = db.orders.find(x => x.code === m[1]);
      if (!o || !STATUS.includes(b.status)) return send(res, 400, { error: 'Pedido ou status inválido.' });
      o.status = b.status; save(db); return send(res, 200, o);
    }

    // arquivos estaticos (somente dentro de /public)
    let file = url.pathname === '/' ? '/index.html' : url.pathname === '/admin' ? '/admin.html' : url.pathname;
    const full = path.join(__dirname, 'public', path.normalize(file));
    if (!full.startsWith(path.join(__dirname, 'public')) || !fs.existsSync(full)) { res.writeHead(404); return res.end('Não encontrado'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream' });
    fs.createReadStream(full).pipe(res);
  } catch (e) { send(res, 400, { error: 'Requisição inválida.' }); }
}).listen(PORT, () => {
  console.log(`Dona Clara rodando em http://localhost:${PORT}`);
  if (!ADMIN) console.log('Aviso: defina ADMIN_PASSWORD no .env para liberar o painel /admin.');
});
