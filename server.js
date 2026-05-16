const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

const defaultTasks = [
  { id: "task-subuh", nama: "Subuh", ikon: "🕌", poin: 20, status: false },
  { id: "task-dzuhur", nama: "Dzuhur", ikon: "🕌", poin: 20, status: false },
  { id: "task-ashar", nama: "Ashar", ikon: "🕌", poin: 20, status: false },
  { id: "task-maghrib", nama: "Maghrib", ikon: "🕌", poin: 20, status: false },
  { id: "task-isya", nama: "Isya", ikon: "🕌", poin: 20, status: false },
  { id: "task-ngaji", nama: "Ngaji", ikon: "📖", poin: 25, status: false },
  { id: "task-murojaah", nama: "Murojaah", ikon: "🎧", poin: 25, status: false },
  { id: "task-rumah", nama: "Bantu rumah", ikon: "🏠", poin: 10, status: false },
  { id: "task-bersih", nama: "Bersih-bersih", ikon: "🧹", poin: 10, status: false },
  { id: "task-cuci", nama: "Cuci piring", ikon: "🧽", poin: 10, status: false },
  { id: "task-belajar", nama: "Belajar", ikon: "📚", poin: 15, status: false },
  { id: "task-baju", nama: "Rapikan baju", ikon: "👕", poin: 10, status: false },
  { id: "task-tanaman", nama: "Siram tanaman", ikon: "🌱", poin: 10, status: false },
  { id: "task-sampah", nama: "Buang sampah", ikon: "🗑️", poin: 10, status: false },
  { id: "task-main", nama: "Rapikan mainan", ikon: "🧸", poin: 10, status: false }
];

const defaultData = {
  anakAktif: 0,
  anak: [
    { id: "anak-ahmad", nama: "Ahmad Firdaus Thabrani", avatar: "🚀", warna: "#2563eb", poin: 0, tugas: clone(defaultTasks) },
    { id: "anak-silsilia", nama: "Silsilia Raihana Adni", avatar: "🌈", warna: "#db2777", poin: 0, tugas: clone(defaultTasks) },
    { id: "anak-aqso", nama: "Muhammad Aqso Darussalam", avatar: "⚽", warna: "#16a34a", poin: 0, tugas: clone(defaultTasks) }
  ],
  hadiah: [
    { id: "gift-snack", nama: "Pilih camilan favorit" },
    { id: "gift-game", nama: "Main game 20 menit" },
    { id: "gift-kartun", nama: "Nonton kartun 20 menit" },
    { id: "gift-jalan", nama: "Jalan sore bersama Aya dan Ami" },
    { id: "gift-es", nama: "Beli es krim" },
    { id: "gift-menu", nama: "Pilih menu makan malam" },
    { id: "gift-stiker", nama: "Stiker bintang spesial" },
    { id: "gift-tabungan", nama: "Bonus uang tabungan Rp5.000" }
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

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) writeStore(defaultData);
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
}

function writeStore(data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
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

function getChild(data, childId) {
  return data.anak.find(child => child.id === childId);
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const data = readStore();

  if (req.method === "GET" && url.pathname === "/api/state") {
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
      poin: clampPoints(body.poin),
      status: false
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
    if (Object.prototype.hasOwnProperty.call(body, "status")) {
      const nextStatus = Boolean(body.status);
      if (task.status !== nextStatus) {
        task.status = nextStatus;
        child.poin += nextStatus ? Number(task.poin) : -Number(task.poin);
        if (child.poin < 0) child.poin = 0;
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
    if (task.status) child.poin = Math.max(0, child.poin - Number(task.poin));
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
    child.tugas.forEach(task => {
      if (!task.status) {
        task.status = true;
        child.poin += Number(task.poin);
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
    child.tugas = child.tugas.map(task => ({ ...task, status: false }));
    writeStore(data);
    sendJson(res, 200, { ok: true, data });
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
    if (child.poin < 1000) {
      sendJson(res, 400, { ok: false, error: "Poin belum cukup." });
      return;
    }
    if (!data.hadiah.length) {
      sendJson(res, 400, { ok: false, error: "Daftar hadiah masih kosong." });
      return;
    }
    const hadiah = data.hadiah[Math.floor(Math.random() * data.hadiah.length)];
    child.poin -= 1000;
    const entry = {
      id: newId("win"),
      childId: child.id,
      childName: child.nama,
      hadiah: hadiah.nama,
      waktu: new Date().toISOString()
    };
    data.riwayat.unshift(entry);
    data.riwayat = data.riwayat.slice(0, 20);
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
