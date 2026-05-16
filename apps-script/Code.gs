const SPREADSHEET_ID = '1JPmK5LsYCMfdM8S0a94OTIlg0waRuOFYTYO_0T4SG98';
const STATE_SHEET = 'State';
const STATE_KEY = 'appState';
const TIME_ZONE = 'Asia/Jakarta';

const defaultTasks = [
  { id: 'task-subuh', nama: 'Subuh', ikon: '🕌', poin: 20 },
  { id: 'task-dzuhur', nama: 'Dzuhur', ikon: '🕌', poin: 20 },
  { id: 'task-ashar', nama: 'Ashar', ikon: '🕌', poin: 20 },
  { id: 'task-maghrib', nama: 'Maghrib', ikon: '🕌', poin: 20 },
  { id: 'task-isya', nama: 'Isya', ikon: '🕌', poin: 20 },
  { id: 'task-ngaji', nama: 'ngaji', ikon: '📖', poin: 25 },
  { id: 'task-murojaah', nama: 'murojaah', ikon: '🎧', poin: 25 },
  { id: 'task-rumah', nama: 'rumah', ikon: '🏠', poin: 10 },
  { id: 'task-bersih', nama: 'bersih', ikon: '🧹', poin: 10 },
  { id: 'task-cuci', nama: 'cuci', ikon: '🧺', poin: 10 },
  { id: 'task-belajar', nama: 'belajar', ikon: '📚', poin: 15 },
  { id: 'task-baju', nama: 'baju', ikon: '👕', poin: 10 },
  { id: 'task-tanaman', nama: 'tanaman', ikon: '🌱', poin: 10 },
  { id: 'task-sampah', nama: 'sampah', ikon: '🗑️', poin: 10 },
  { id: 'task-masak', nama: 'masak', ikon: '🍚', poin: 10 },
  { id: 'task-belanja', nama: 'belanja', ikon: '🛒', poin: 10 },
  { id: 'task-minum', nama: 'minum', ikon: '🥛', poin: 5 },
  { id: 'task-tidur', nama: 'tidur', ikon: '🛏️', poin: 10 },
  { id: 'task-sikat-gigi', nama: 'sikat gigi', ikon: '🪥', poin: 10 },
  { id: 'task-mandi', nama: 'mandi', ikon: '🚿', poin: 10 },
  { id: 'task-rapikan-mainan', nama: 'rapikan mainan', ikon: '🧸', poin: 10 },
  { id: 'task-prioritas', nama: 'prioritas', ikon: '⭐', poin: 20 }
];

const defaultPenaltyPresets = [
  { id: 'pen-lupa', nama: 'Lupa tugas setelah diingatkan', poin: 5 },
  { id: 'pen-main', nama: 'Mainan tidak dirapikan', poin: 10 },
  { id: 'pen-sopan', nama: 'Bicara kurang sopan', poin: 15 },
  { id: 'pen-ribut', nama: 'Mengganggu atau bertengkar', poin: 20 },
  { id: 'pen-jujur', nama: 'Tidak jujur', poin: 25 }
];

const defaultData = {
  schemaVersion: 3,
  ahmadInitialResetDone: true,
  anakAktif: 0,
  penaltyPresets: defaultPenaltyPresets,
  anak: [
    { id: 'anak-ahmad', nama: 'Ahmad Firdaus Thabrani', avatarText: 'IM', avatarName: 'Iron Man', warna: '#dc2626', accent: '#facc15', saldo: 0, tugas: defaultTasks, harian: {} },
    { id: 'anak-silsilia', nama: 'Silsilia Raihana Adni', avatarText: 'MM', avatarName: 'My Melody', warna: '#db2777', accent: '#fecdd3', saldo: 0, tugas: defaultTasks, harian: {} },
    { id: 'anak-aqso', nama: 'Muhammad Aqso Darussalam', avatarText: 'TAYO', avatarName: 'Bus Tayo', warna: '#2563eb', accent: '#60a5fa', saldo: 0, tugas: defaultTasks, harian: {} }
  ],
  hadiah: [
    { id: 'gift-snack', nama: 'Pilih camilan favorit' },
    { id: 'gift-game', nama: 'Main game 20 menit' },
    { id: 'gift-kartun', nama: 'Nonton kartun 20 menit' },
    { id: 'gift-jalan', nama: 'Jalan sore bersama Aya dan Ami' },
    { id: 'gift-es', nama: 'Beli es krim' },
    { id: 'gift-menu', nama: 'Pilih menu makan malam' },
    { id: 'gift-stiker', nama: 'Stiker bintang spesial' },
    { id: 'gift-tabungan', nama: 'Bonus uang tabungan Rp5.000' },
    { id: 'gift-buku', nama: 'Bebas pilih buku cerita' },
    { id: 'gift-main', nama: 'Waktu main tambahan 15 menit' }
  ],
  riwayat: []
};

function doGet() {
  return jsonResponse({ ok: true, data: readState() });
}

function doPost(event) {
  try {
    const request = JSON.parse((event.postData && event.postData.contents) || '{}');
    const response = routeRequest(request.path || '/api/state', request.method || 'GET', request.body || {});
    return jsonResponse(response);
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) });
  }
}

function routeRequest(path, method, body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = readState();
    const today = todayKey();

    if (method === 'GET' && path === '/api/state') {
      data.today = today;
      writeState(data);
      return { ok: true, data };
    }

    if (method === 'PUT' && path === '/api/active-child') {
      const index = Number(body.index);
      if (!Number.isInteger(index) || index < 0 || index >= data.anak.length) throw new Error('Anak tidak ditemukan.');
      data.anakAktif = index;
      writeState(data);
      return { ok: true, data };
    }

    if (method === 'POST' && path === '/api/tasks') {
      const child = getChild(data, body.childId);
      const nama = cleanText(body.nama);
      if (!child || !nama) throw new Error('Data tugas belum lengkap.');
      child.tugas.push({ id: newId('task'), nama, ikon: cleanText(body.ikon, '⭐').slice(0, 8), poin: clampPoints(body.poin) });
      writeState(data);
      return { ok: true, data };
    }

    if (method === 'PATCH' && path.indexOf('/api/tasks/') === 0) {
      const taskId = decodeURIComponent(path.split('/').pop());
      const child = getChild(data, body.childId);
      const task = child && child.tugas.find(item => item.id === taskId);
      if (!child || !task) throw new Error('Tugas tidak ditemukan.');
      const day = getDay(child, body.date || today);
      if (Object.prototype.hasOwnProperty.call(body, 'status')) {
        const nextStatus = Boolean(body.status);
        const done = day.completed.indexOf(taskId) !== -1;
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
      writeState(data);
      return { ok: true, data };
    }

    if (method === 'DELETE' && path.indexOf('/api/tasks/') === 0) {
      const taskId = decodeURIComponent(path.split('/').pop());
      const child = getChild(data, body.childId);
      const index = child ? child.tugas.findIndex(item => item.id === taskId) : -1;
      if (!child || index === -1) throw new Error('Tugas tidak ditemukan.');
      const task = child.tugas.splice(index, 1)[0];
      Object.keys(child.harian || {}).forEach(date => {
        const day = child.harian[date];
        if (day.completed && day.completed.indexOf(taskId) !== -1) {
          day.completed = day.completed.filter(id => id !== taskId);
          day.earned = Math.max(0, Number(day.earned || 0) - Number(task.poin));
          child.saldo = Math.max(0, child.saldo - Number(task.poin));
        }
      });
      writeState(data);
      return { ok: true, data };
    }

    if (method === 'POST' && path === '/api/tasks/complete-all') {
      const child = getChild(data, body.childId);
      if (!child) throw new Error('Anak tidak ditemukan.');
      const day = getDay(child, body.date || today);
      child.tugas.forEach(task => {
        if (day.completed.indexOf(task.id) === -1) {
          day.completed.push(task.id);
          day.earned += Number(task.poin);
          child.saldo += Number(task.poin);
        }
      });
      writeState(data);
      return { ok: true, data };
    }

    if (method === 'POST' && path === '/api/tasks/reset-day') {
      const child = getChild(data, body.childId);
      if (!child) throw new Error('Anak tidak ditemukan.');
      const day = getDay(child, body.date || today);
      child.saldo = Math.max(0, child.saldo - Number(day.earned || 0) + Number(day.deducted || 0));
      day.completed = [];
      day.earned = 0;
      day.deducted = 0;
      day.penalties = [];
      writeState(data);
      return { ok: true, data };
    }

    if (method === 'POST' && path === '/api/penalties') {
      const child = getChild(data, body.childId);
      const nama = cleanText(body.nama);
      const poin = clampPenalty(body.poin);
      if (!child || !nama) throw new Error('Data pengurang belum lengkap.');
      const day = getDay(child, body.date || today);
      const entry = { id: newId('penalty'), nama, poin, waktu: new Date().toISOString() };
      day.penalties.unshift(entry);
      day.deducted += poin;
      child.saldo = Math.max(0, child.saldo - poin);
      writeState(data);
      return { ok: true, data, penalty: entry };
    }

    if (method === 'POST' && path === '/api/gifts') {
      const nama = cleanText(body.nama);
      if (!nama) throw new Error('Nama hadiah belum diisi.');
      data.hadiah.push({ id: newId('gift'), nama });
      writeState(data);
      return { ok: true, data };
    }

    if (method === 'PATCH' && path.indexOf('/api/gifts/') === 0) {
      const giftId = decodeURIComponent(path.split('/').pop());
      const gift = data.hadiah.find(item => item.id === giftId);
      if (!gift) throw new Error('Hadiah tidak ditemukan.');
      gift.nama = cleanText(body.nama, gift.nama);
      writeState(data);
      return { ok: true, data };
    }

    if (method === 'DELETE' && path.indexOf('/api/gifts/') === 0) {
      const giftId = decodeURIComponent(path.split('/').pop());
      const index = data.hadiah.findIndex(item => item.id === giftId);
      if (index === -1) throw new Error('Hadiah tidak ditemukan.');
      data.hadiah.splice(index, 1);
      writeState(data);
      return { ok: true, data };
    }

    if (method === 'POST' && path === '/api/gacha') {
      const child = getChild(data, body.childId);
      if (!child) throw new Error('Anak tidak ditemukan.');
      if (child.saldo < 1000) throw new Error('Poin belum cukup.');
      if (!data.hadiah.length) throw new Error('Daftar hadiah masih kosong.');
      const gift = data.hadiah[Math.floor(Math.random() * data.hadiah.length)];
      const day = getDay(child, body.date || today);
      child.saldo -= 1000;
      const entry = { id: newId('win'), childId: child.id, childName: child.nama, hadiah: gift.nama, tanggal: day.tanggal, waktu: new Date().toISOString() };
      day.gacha.unshift(entry);
      data.riwayat.unshift(entry);
      data.riwayat = data.riwayat.slice(0, 50);
      writeState(data);
      return { ok: true, data, hadiah: entry };
    }

    throw new Error('API tidak ditemukan.');
  } finally {
    lock.releaseLock();
  }
}

function readState() {
  const sheet = getStateSheet();
  const stored = sheet.getRange(2, 2).getValue();
  if (!stored) {
    const fresh = migrateData(clone(defaultData));
    writeState(fresh);
    return fresh;
  }
  return migrateData(JSON.parse(stored));
}

function writeState(data) {
  const sheet = getStateSheet();
  sheet.getRange(1, 1, 1, 2).setValues([['key', 'json']]);
  sheet.getRange(2, 1, 1, 2).setValues([[STATE_KEY, JSON.stringify(data)]]);
}

function getStateSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(STATE_SHEET);
  if (!sheet) sheet = spreadsheet.insertSheet(STATE_SHEET);
  return sheet;
}

function migrateData(data) {
  const migrated = Object.assign(clone(defaultData), data || {});
  migrated.schemaVersion = 3;
  migrated.ahmadInitialResetDone = true;
  migrated.today = todayKey();
  migrated.penaltyPresets = Array.isArray(migrated.penaltyPresets) ? migrated.penaltyPresets : clone(defaultPenaltyPresets);
  migrated.hadiah = mergeDefaultGifts(migrated.hadiah || []);
  migrated.riwayat = Array.isArray(migrated.riwayat) ? migrated.riwayat : [];
  migrated.anak = (Array.isArray(migrated.anak) ? migrated.anak : defaultData.anak).map((child, index) => {
    const template = defaultData.anak[index] || defaultData.anak[0];
    const next = Object.assign(clone(template), child || {});
    next.saldo = Number(next.saldo || 0);
    next.tugas = mergeDefaultTasks(next.tugas || []);
    next.harian = next.harian && typeof next.harian === 'object' ? next.harian : {};
    getDay(next, migrated.today);
    return next;
  });
  return migrated;
}

function mergeDefaultTasks(tasks) {
  const names = {};
  const ids = {};
  const merged = Array.isArray(tasks) ? tasks.slice() : [];
  merged.forEach(task => {
    ids[task.id] = true;
    names[String(task.nama || '').toLowerCase()] = true;
  });
  defaultTasks.forEach(task => {
    if (!ids[task.id] && !names[task.nama.toLowerCase()]) merged.push(clone(task));
  });
  return merged;
}

function mergeDefaultGifts(gifts) {
  const merged = Array.isArray(gifts) ? gifts.map((gift, index) => typeof gift === 'string' ? { id: 'gift-local-' + index, nama: gift } : gift) : [];
  const names = {};
  merged.forEach(gift => names[String(gift.nama || '').toLowerCase()] = true);
  defaultData.hadiah.forEach(gift => {
    if (!names[gift.nama.toLowerCase()]) merged.push(clone(gift));
  });
  return merged;
}

function getChild(data, childId) {
  return data.anak.find(child => child.id === childId);
}

function getDay(child, date) {
  if (!child.harian) child.harian = {};
  if (!child.harian[date]) child.harian[date] = { tanggal: date, completed: [], earned: 0, deducted: 0, penalties: [], gacha: [] };
  const day = child.harian[date];
  day.completed = Array.isArray(day.completed) ? day.completed : [];
  day.earned = Number(day.earned || 0);
  day.deducted = Number(day.deducted || 0);
  day.penalties = Array.isArray(day.penalties) ? day.penalties : [];
  day.gacha = Array.isArray(day.gacha) ? day.gacha : [];
  return day;
}

function todayKey() {
  return Utilities.formatDate(new Date(), TIME_ZONE, 'yyyy-MM-dd');
}

function cleanText(value, fallback) {
  return String(value || fallback || '').trim().slice(0, 80);
}

function clampPoints(value) {
  const number = Number(value);
  if (!isFinite(number)) return 10;
  return Math.max(1, Math.min(500, Math.round(number)));
}

function clampPenalty(value) {
  const number = Number(value);
  if (!isFinite(number)) return 5;
  return Math.max(1, Math.min(100, Math.round(number)));
}

function newId(prefix) {
  return prefix + '-' + Utilities.getUuid().slice(0, 12);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
