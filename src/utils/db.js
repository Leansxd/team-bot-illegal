const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), 'data');
const dataFile = path.join(dataDir, 'ot.json');

function ensureDb() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({}), 'utf8');
}

function readDb() {
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

function writeDb(obj) {
  fs.writeFileSync(dataFile, JSON.stringify(obj), 'utf8');
}

function addOt(userId, amount) {
  const db = readDb();
  const current = db[userId] || 0;
  db[userId] = current + amount;
  writeDb(db);
}

function removeOt(userId, amount) {
  const db = readDb();
  const current = db[userId] || 0;
  db[userId] = Math.max(0, current - amount);
  writeDb(db);
}

function getOt(userId) {
  const db = readDb();
  return db[userId] || 0;
}

function topOt(limit = 10) {
  const db = readDb();
  const rows = Object.entries(db)
    .map(([user_id, amount]) => ({ user_id, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
  return rows;
}

module.exports = { ensureDb, addOt, removeOt, getOt, topOt };
