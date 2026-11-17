import pg from 'pg';
import { Readable } from 'node:stream';
import { handleRequest } from '../app.mjs';
let pool;
let schemaReady;
async function database() {
  if (!process.env.DATABASE_URL) throw new Error('Falta conectar la base de datos de la sala.');
  pool ||= new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  schemaReady ||= pool.query('CREATE TABLE IF NOT EXISTS aula_rooms (code TEXT PRIMARY KEY, data JSONB NOT NULL, expires_at TIMESTAMPTZ NOT NULL)').catch(error => { schemaReady = null; throw error; });
  await schemaReady;
  return pool;
}
export default async function handler(req, res) {
  let client;
  try {
    if (req.method !== 'POST') { res.status(405).json({ error: 'Utiliza POST.' }); return; }
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const encoded = JSON.stringify(data);
    if (Buffer.byteLength(encoded) > 12000) { res.status(413).json({ error: 'Mensaje demasiado largo' }); return; }
    const code = String(data.code || '');
    if (data.action !== 'create' && !/^[A-F0-9]{6}$/.test(code)) { res.status(404).json({ error: 'Revisa el código de sala.' }); return; }
    client = await (await database()).connect();
    await client.query('BEGIN');
    const rooms = new Map();
    if (data.action !== 'create') {
      const result = await client.query('SELECT data FROM aula_rooms WHERE code = $1 AND expires_at > NOW() FOR UPDATE', [code]);
      if (result.rows.length) rooms.set(code, result.rows[0].data);
    }
    const incoming = Readable.from([encoded]);
    incoming.url = '/api';
    let status = 200;
    let output;
    const outgoing = { writeHead(value) { status = value; }, end(value) { output = value; } };
    await handleRequest(incoming, outgoing, rooms);
    if (status < 400) {
      for (const [roomCode, room] of rooms) {
        if (data.action === 'create') {
          await client.query("INSERT INTO aula_rooms(code,data,expires_at) VALUES($1,$2,NOW() + INTERVAL '24 hours')", [roomCode, JSON.stringify(room)]);
        } else if (data.action) {
          await client.query('UPDATE aula_rooms SET data = $2 WHERE code = $1', [roomCode, JSON.stringify(room)]);
        }
      }
    }
    await client.query('COMMIT');
    res.setHeader('Cache-Control', 'no-store');
    res.status(status).json(JSON.parse(output));
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('Room request failed', error.message);
    res.status(503).json({ error: 'La sala no está disponible. Inténtalo de nuevo en un momento.' });
  } finally {
    client?.release();
  }
}
