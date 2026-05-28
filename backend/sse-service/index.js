import express from "express";
import { Client } from "pg";

const PORT = process.env.PORT || 3001;
const PG_HOST = process.env.PGHOST || "db";
const PG_PORT = process.env.PGPORT || 5432;
const PG_DB = process.env.PGDATABASE || "postgres";
const PG_USER = process.env.PGUSER || "postgres";
const PG_PASSWORD = process.env.PGPASSWORD || "captionit@1234";
const PG_CHANNEL = process.env.PG_CHANNEL || "messages_changes";
const KEEPALIVE_INTERVAL_MS = 25_000;

const clients = new Set();
let clientIdSeq = 0;

function addClient(res) {
  const id = ++clientIdSeq;
  const client = { id, res };
  clients.add(client);
  return client;
}

function removeClient(client) {
  clients.delete(client);
}

function broadcast(eventName, data) {
  const chunk = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    client.res.write(chunk);
  }
}

async function createListenerClient() {
  const pg = new Client({
    host: PG_HOST,
    port: PG_PORT,
    database: PG_DB,
    user: PG_USER,
    password: PG_PASSWORD,
  });

  pg.on("error", (err) => {
    console.error("connection error:", err.message);
    setTimeout(() => reconnect(), 5_000);
  });

  pg.on("notification", (msg) => {
    if (msg.channel !== PG_CHANNEL) {
      return;
    }

    let payload;
    try {
      payload = JSON.parse(msg.payload);
    } catch {
      console.error("could not parse notification payload:", msg.payload);
      return;
    }

    const eventName = payload.table;
    console.log(`Canvi detectat a la taula: ${eventName}`);

    broadcast(eventName, payload);
  });

  await pg.connect();
  await pg.query(`LISTEN ${PG_CHANNEL}`);
  console.log(`listening on channel "${PG_CHANNEL}"`);
  return pg;
}

let pgClient = null;

async function reconnect() {
  try {
    if (pgClient) {
      pgClient.removeAllListeners();
      try {
        await pgClient.end();
      } catch {
        /* ignore */
      }
    }
    pgClient = await createListenerClient();
  } catch (err) {
    console.error("postgres reconnect failed:", err.message, " retrying in 5s");
    setTimeout(() => reconnect(), 5_000);
  }
}

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const client = addClient(res);
  console.log(`client ${client.id} connected (total: ${clients.size})`);

  res.write(`event: connected\ndata: ${JSON.stringify({ clientId: client.id, clients: clients.size })}\n\n`);

  const keepalive = setInterval(() => {
    res.write(": keepalive\n\n");
  }, KEEPALIVE_INTERVAL_MS);

  req.on("close", () => {
    clearInterval(keepalive);
    removeClient(client);
    console.log(`client ${client.id} disconnected (total: ${clients.size})`);
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", clients: clients.size });
});

app.post('/broadcast', (req, res) => {
  const { event, data } = req.body || {};
  if (!event) {
    return res.status(400).json({ error: 'missing event' });
  }

  try {
    broadcast(event, data || {});
    return res.json({ ok: true });
  } catch (err) {
    console.error('broadcast error', err);
    return res.status(500).json({ error: 'broadcast failed' });
  }
});

(async () => {
  await reconnect();
  app.listen(PORT, () => {
    console.log(`Stream endpoint: http://localhost:${PORT}/events`);
    console.log(`Health endpoint: http://localhost:${PORT}/health`);
  });
})();