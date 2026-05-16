const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const TIME_ZONE = "Asia/Jakarta";

const defaultTasks = [
  { id: "task-subuh", nama: "Subuh", ikon: "🕌", poin: 20 },
  { id: "task-dzuhur", nama: "Dzuhur", ikon: "🕌", poin: 20 },
  { id: "task-ashar", nama: "Ashar", ikon: "🕌", poin: 20 },
  { id: "task-maghrib", nama: "Maghrib", ikon: "🕌", poin: 20 },
  { id: "task-isya", nama: "Isya", ikon: "🕌", poin: 20 },
  { id: "task-ngaji", nama: "ngaji", ikon: "📖", poin: 25 },
  { id: "task-murojaah", nama: "murojaah", ikon: "🎧", poin: 25 },
  { id: "task-rumah", nama: "rumah", ikon: "🏠", poin: 10 },
  { id: "task-bersih", nama: "bersih", ikon: "🧹", poin: 10 },
  { id: "task-cuci", nama: "cuci", ikon: "🧺", poin: 10 },
  { id: "task-belajar", nama: "belajar", ikon: "📚", poin: 15 },
  { id: "task-baju", nama: "baju", ikon: "👕", poin: 10 },
  { id: "task-tanaman", nama: "tanaman", ikon: "🌱", poin: 10 },
  { id: "task-sampah", nama: "sampah", ikon: "🗑️", poin: 10 },
  { id: "task-masak", nama: "masak", ikon: "🍚", poin: 10 },
  { id: "task-belanja", nama: "belanja", ikon: "🛒", poin: 10 },
  { id: "task-minum", nama: "minum", ikon: "🥛", poin: 5 },
  { id: "task-tidur", nama: "tidur", ikon: "🛏️", poin: 10 },
  { id: "task-sikat-gigi", nama: "sikat gigi", ikon: "🪥", poin: 10 },
  { id: "task-mandi", nama: "mandi", ikon: "🚿", poin: 10 },
  { id: "task-rapikan-mainan", nama: "rapikan mainan", ikon: "🧸", poin: 10 },
  { id: "task-prioritas", nama: "prioritas", ikon: "⭐", poin: 20 }
];

const defaultPenaltyPresets = [
  { id: "pen-lupa", nama: "Lupa tugas setelah diingatkan", poin: 5 },
  { id: "pen-main", nama: "Mainan tidak dirapikan", poin: 10 },
  { id: "pen-sopan", nama: "Bicara kurang sopan", poin: 15 },
  { id: "pen-ribut", nama: "Mengganggu atau bertengkar", poin: 20 },
  { id: "pen-jujur", nama: "Tidak jujur", poin: 25 }
];

const defaultData = {
  schemaVersion: 3,
  ahmadInitialResetDone: true,
  anakAktif: 0,
  penaltyPresets: clone(defaultPenaltyPresets),
  anak: [
    {
      id: "anak-ahmad",
      nama: "Ahmad Firdaus Thabrani",
      avatarText: "IM",
      avatarName: "Iron Man",
      warna: "#dc2626",
      accent: "#facc15",
      saldo: 0,
      tugas: clone(defaultTasks),
      harian: {}
    },
    {
      id: "anak-silsilia",
      nama: "Silsilia Raihana Adni",
      avatarText: "MM",
      avatarName: "My Melody",
      warna: "#db2777",
      accent: "#fecdd3",
      saldo: 0,
      tugas: clone(defaultTasks),
      harian: {}
    },
    {
      id: "anak-aqso",
      nama: "Muhammad Aqso Darussalam",
      avatarText: "TAYO",
      avatarName: "Bus Tayo",
      warna: "#2563eb",
      accent: "#60a5fa",
      saldo: 0,
      tugas: clone(defaultTasks),
      harian: {}
    }
  ],
  hadiah: [
    { id: "gift-snack", nama: "Pilih camilan favorit" },
    { id: "gift-game", nama: "Main game 20 menit" },
    { id: "gift-kartun", nama: "Nonton kartun 20 menit" },
    { id: "gift-jalan", nama: "Jalan sore bersama Aya dan Ami" },
    { id: "gift-es", nama: "Beli es krim" },
    { id: "gift-menu", nama: "Pilih menu makan malam" },
    { id: "gift-stiker", nama: "Stiker bintang spesial" },
    { id: "gift-tabungan", nama: "Bonus uang tabungan Rp5.000" },
    { id: "gift-buku", nama: "Bebas pilih buku cerita" },
    { id: "gift-main", nama: "Waktu main tambahan 15 menit" }
  ],
  riwayat: []
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function todayKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const pick = type => parts.find(part => part.type === type).value;
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) writeStore(defaultData);
}

function readStore() {
  ensureStore();
  const data = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
  return migrateData(data);
}

function writeStore(data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

function migrateData(data) {
  const migrated = { ...clone(defaultData), ...data };
  migrated.schemaVersion = 3;
  migrated.ahmadInitialResetDone = true;
  migrated.penaltyPresets = Array.isArray(data.penaltyPresets) ? data.penaltyPresets : clone(defaultPenaltyPresets);
  migrated.hadiah = normalizeGifts(data.hadiah);
  migrated.riwayat = Array.isArray(data.riwayat) ? data.riwayat : [];
  migrated.anak = (Array.isArray(data.anak) ? data.anak : defaultData.anak).map((child, index) => {
    const template = defaultData.anak[index] || defaultData.anak[0];
    const next = {
      ...clone(template),
      ...child,
      saldo: Number.isFinite(Number(child.saldo)) ? Number(child.saldo) : Number(child.poin || 0),
      tugas: mergeDefaultTasks(normalizeTasks(child.tugas && child.tugas.length ? child.tugas : template.tugas)),
      harian: child.harian && typeof child.harian === "object" ? child.harian : {}
    };
    next.avatarText = template.avatarText;
    next.avatarName = template.avatarName;
    next.warna = template.warna;
    next.accent = template.accent;
    migrateLegacyCompleted(next);
    getDay(next, todayKey());
    delete next.poin;
    return next;
  });
  return migrated;
}

function normalizeTasks(tasks) {
  return tasks.map((task, index) => ({
    id: task.id || newId(`task-${index}`),
    nama: cleanText(task.nama, "Misi"),
    ikon: cleanText(task.ikon, "⭐").slice(0, 8),
    poin: clampPoints(task.poin)
  }));
}

function mergeDefaultTasks(tasks) {
  const normalized = Array.isArray(tasks) ? tasks : [];
  const names = new Set(normalized.map(task => task.nama.toLowerCase()));
  const ids = new Set(normalized.map(task => task.id));
  const merged = [...normalized];
  defaultTasks.forEach(task => {
    if (!ids.has(task.id) && !names.has(task.nama.toLowerCase())) {
      merged.push(clone(task));
    }
  });
  return merged;
}

function normalizeGifts(gifts) {
  const normalized = !Array.isArray(gifts) ? [] : gifts.map((gift, index) => (
    typeof gift === "string"
      ? { id: newId(`gift-${index}`), nama: cleanText(gift, "Hadiah") }
      : { id: gift.id || newId(`gift-${index}`), nama: cleanText(gift.nama, "Hadiah") }
  ));
  const names = new Set(normalized.map(gift => gift.nama.toLowerCase()));
  defaultData.hadiah.forEach(gift => {
    if (!names.has(gift.nama.toLowerCase())) normalized.push(clone(gift));
  });
  return normalized;
}

function migrateLegacyCompleted(child) {
  const legacyDone = (child.tugas || []).filter(task => task.status).map(task => task.id);
  if (!legacyDone.length) return;
  const day = getDay(child, todayKey());
  legacyDone.forEach(taskId => {
    if (!day.completed.includes(taskId)) {
      const task = child.tugas.find(item => item.id === taskId);
      day.completed.push(taskId);
      day.earned += Number(task ? task.poin : 0);
    }
  });
}

function getDay(child, date) {
  if (!child.harian) child.harian = {};
  if (!child.harian[date]) {
    child.harian[date] = {
      tanggal: date,
      completed: [],
      earned: 0,
      deducted: 0,
      penalties: [],
      gacha: []
    };
  }
  const day = child.harian[date];
  day.completed = Array.isArray(day.completed) ? day.completed : [];
  day.earned = Number(day.earned || 0);
  day.deducted = Number(day.deducted || 0);
  day.penalties = Array.isArray(day.penalties) ? day.penalties : [];
  day.gacha = Array.isArray(day.gacha) ? day.gacha : [];
  return day;
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Payload terlalu besar."));
      }
    });
    req.on("end", () => resolve(body ? JSON.parse(body) : {}));
    req.on("error", reject);
  });
}

function newId(prefix) {
  return `${prefix}-${crypto.randomBytes(6).toString("hex")}`;
}

function cleanText(value, fallback = "") {
  return String(value || fallback).trim().slice(0, 80);
}

function clampPoints(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 10;
  return Math.max(1, Math.min(500, Math.round(number)));
}

function clampPenalty(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 5;
  return Math.max(1, Math.min(100, Math.round(number)));
}

function getChild(data, childId) {
  return data.anak.find(child => child.id === childId);
}

function taskStatus(child, taskId, date = todayKey()) {
  return getDay(child, date).completed.includes(taskId);
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const data = readStore();
  const date = cleanText(url.searchParams.get("date"), todayKey()) || todayKey();

  if (req.method === "GET" && url.pathname === "/api/state") {
    data.today = todayKey();
    writeStore(data);
    sendJson(res, 200, { ok: true, data });
    return;
  }

  if (req.method === "PUT" && url.pathname === "/api/active-child") {
    const body = await readBody(req);
    const index = Number(body.index);
    if (!Number.isInteger(index) || index < 0 || index >= data.anak.length) {
      sendJson(res, 400, { ok: false, error: "Anak tidak ditemukan." });
      return;
    }
    data.anakAktif = index;
    writeStore(data);
    sendJson(res, 200, { ok: true, data });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/tasks") {
    const body = await readBody(req);
    const child = getChild(data, body.childId);
    const nama = cleanText(body.nama);
    if (!child || !nama) {
      sendJson(res, 400, { ok: false, error: "Data tugas belum lengkap." });
      return;
    }
    child.tugas.push({
      id: newId("task"),
      nama,
      ikon: cleanText(body.ikon, "⭐").slice(0, 8),
      poin: clampPoints(body.poin)
    });
    writeStore(data);
    sendJson(res, 201, { ok: true, data });
    return;
  }

  if (req.method === "PATCH" && url.pathname.startsWith("/api/tasks/")) {
    const taskId = decodeURIComponent(url.pathname.split("/").pop());
    const body = await readBody(req);
    const child = getChild(data, body.childId);
    const task = child && child.tugas.find(item => item.id === taskId);
    if (!child || !task) {
      sendJson(res, 404, { ok: false, error: "Tugas tidak ditemukan." });
      return;
    }
    const day = getDay(child, body.date || todayKey());
    if (Object.prototype.hasOwnProperty.call(body, "status")) {
      const nextStatus = Boolean(body.status);
      const done = day.completed.includes(taskId);
      if (nextStatus && !done) {
        day.completed.push(taskId);
        day.earned += Number(task.poin);
        child.saldo += Number(task.poin);
      }
      if (!nextStatus && done) {
        day.completed = day.completed.filter(id => id !== taskId);
        day.earned = Math.max(0, day.earned - Number(task.poin));
        child.saldo = Math.max(0, child.saldo - Number(task.poin));
      }
    }
    if (body.nama !== undefined) task.nama = cleanText(body.nama, task.nama);
    if (body.ikon !== undefined) task.ikon = cleanText(body.ikon, task.ikon).slice(0, 8);
    if (body.poin !== undefined) task.poin = clampPoints(body.poin);
    writeStore(data);
    sendJson(res, 200, { ok: true, data });
    return;
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/tasks/")) {
    const taskId = decodeURIComponent(url.pathname.split("/").pop());
    const body = await readBody(req);
    const child = getChild(data, body.childId);
    const index = child ? child.tugas.findIndex(item => item.id === taskId) : -1;
    if (!child || index === -1) {
      sendJson(res, 404, { ok: false, error: "Tugas tidak ditemukan." });
      return;
    }
    const [task] = child.tugas.splice(index, 1);
    Object.values(child.harian || {}).forEach(day => {
      if (day.completed && day.completed.includes(taskId)) {
        day.completed = day.completed.filter(id => id !== taskId);
        day.earned = Math.max(0, Number(day.earned || 0) - Number(task.poin));
        child.saldo = Math.max(0, child.saldo - Number(task.poin));
      }
    });
    writeStore(data);
    sendJson(res, 200, { ok: true, data });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/tasks/complete-all") {
    const body = await readBody(req);
    const child = getChild(data, body.childId);
    if (!child) {
      sendJson(res, 404, { ok: false, error: "Anak tidak ditemukan." });
      return;
    }
    const day = getDay(child, body.date || todayKey());
    child.tugas.forEach(task => {
      if (!day.completed.includes(task.id)) {
        day.completed.push(task.id);
        day.earned += Number(task.poin);
        child.saldo += Number(task.poin);
      }
    });
    writeStore(data);
    sendJson(res, 200, { ok: true, data });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/tasks/reset-day") {
    const body = await readBody(req);
    const child = getChild(data, body.childId);
    if (!child) {
      sendJson(res, 404, { ok: false, error: "Anak tidak ditemukan." });
      return;
    }
    const day = getDay(child, body.date || todayKey());
    child.saldo = Math.max(0, child.saldo - Number(day.earned || 0) + Number(day.deducted || 0));
    day.completed = [];
    day.earned = 0;
    day.deducted = 0;
    day.penalties = [];
    writeStore(data);
    sendJson(res, 200, { ok: true, data });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/penalties") {
    const body = await readBody(req);
    const child = getChild(data, body.childId);
    const nama = cleanText(body.nama);
    const poin = clampPenalty(body.poin);
    if (!child || !nama) {
      sendJson(res, 400, { ok: false, error: "Data pengurang belum lengkap." });
      return;
    }
    const day = getDay(child, body.date || todayKey());
    const entry = {
      id: newId("penalty"),
      nama,
      poin,
      waktu: new Date().toISOString()
    };
    day.penalties.unshift(entry);
    day.deducted += poin;
    child.saldo = Math.max(0, child.saldo - poin);
    writeStore(data);
    sendJson(res, 201, { ok: true, data, penalty: entry });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/gifts") {
    const body = await readBody(req);
    const nama = cleanText(body.nama);
    if (!nama) {
      sendJson(res, 400, { ok: false, error: "Nama hadiah belum diisi." });
      return;
    }
    data.hadiah.push({ id: newId("gift"), nama });
    writeStore(data);
    sendJson(res, 201, { ok: true, data });
    return;
  }

  if (req.method === "PATCH" && url.pathname.startsWith("/api/gifts/")) {
    const giftId = decodeURIComponent(url.pathname.split("/").pop());
    const body = await readBody(req);
    const gift = data.hadiah.find(item => item.id === giftId);
    if (!gift) {
      sendJson(res, 404, { ok: false, error: "Hadiah tidak ditemukan." });
      return;
    }
    gift.nama = cleanText(body.nama, gift.nama);
    writeStore(data);
    sendJson(res, 200, { ok: true, data });
    return;
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/gifts/")) {
    const giftId = decodeURIComponent(url.pathname.split("/").pop());
    const index = data.hadiah.findIndex(item => item.id === giftId);
    if (index === -1) {
      sendJson(res, 404, { ok: false, error: "Hadiah tidak ditemukan." });
      return;
    }
    data.hadiah.splice(index, 1);
    writeStore(data);
    sendJson(res, 200, { ok: true, data });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/gacha") {
    const body = await readBody(req);
    const child = getChild(data, body.childId);
    if (!child) {
      sendJson(res, 404, { ok: false, error: "Anak tidak ditemukan." });
      return;
    }
    if (child.saldo < 1000) {
      sendJson(res, 400, { ok: false, error: "Poin belum cukup." });
      return;
    }
    if (!data.hadiah.length) {
      sendJson(res, 400, { ok: false, error: "Daftar hadiah masih kosong." });
      return;
    }
    const hadiah = data.hadiah[Math.floor(Math.random() * data.hadiah.length)];
    const day = getDay(child, body.date || todayKey());
    child.saldo -= 1000;
    const entry = {
      id: newId("win"),
      childId: child.id,
      childName: child.nama,
      hadiah: hadiah.nama,
      tanggal: day.tanggal,
      waktu: new Date().toISOString()
    };
    day.gacha.unshift(entry);
    data.riwayat.unshift(entry);
    data.riwayat = data.riwayat.slice(0, 50);
    writeStore(data);
    sendJson(res, 200, { ok: true, data, hadiah: entry });
    return;
  }

  sendJson(res, 404, { ok: false, error: "API tidak ditemukan." });
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(PUBLIC_DIR, requestedPath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Halaman tidak ditemukan.");
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=3600"
    });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res).catch(error => {
      sendJson(res, 500, { ok: false, error: error.message || "Server bermasalah." });
    });
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  ensureStore();
  console.log(`Tombol Hadiah jalan di http://localhost:${PORT}`);
});
