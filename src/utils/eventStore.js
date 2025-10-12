const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '..', 'data', 'event.json');

function ensureDir() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJsonSafe() {
  try {
    if (!fs.existsSync(STORE_PATH)) return null;
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(obj) {
  ensureDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(obj, null, 2));
}

function getActiveEvent() {
  return readJsonSafe();
}

function saveActiveEvent(evt) {
  writeJson(evt);
}

function clearEvent() {
  if (fs.existsSync(STORE_PATH)) fs.unlinkSync(STORE_PATH);
}

function addParticipant(userId) {
  const evt = getActiveEvent();
  if (!evt) return false;
  if (!evt.participants) evt.participants = [];
  if (!evt.participants.includes(userId)) {
    evt.participants.push(userId);
    saveActiveEvent(evt);
    return true;
  }
  return false;
}

module.exports = {
  getActiveEvent,
  saveActiveEvent,
  clearEvent,
  addParticipant
};
