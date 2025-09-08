const db = new Map();

export function save(record) {
  db.set(record.shortcode, record);
}

export function fetch(code) {
  return db.get(code) || null;
}

export function exists(code) {
  return db.has(code);
}

export function recordClick(code, click) {
  const entry = db.get(code);
  if (!entry) return;
  entry.hits += 1;
  entry.lastAccess = new Date();
  entry.clicks.push(click);
}
