const ikonPilihan = [
  "🕌", "📖", "🎧", "🏠", "🧹", "🧽", "📚", "👕", "🌱", "🗑️",
  "🍚", "🛒", "🥛", "🛏️", "🪥", "🚿", "🧸", "⭐", "🎨", "⚽",
  "🚲", "💪", "🍎", "🎒", "✅", "💡", "🎁", "🍬", "🎮", "📺"
];

const fallbackPenaltyPresets = [
  { id: "pen-lupa", nama: "Lupa tugas setelah diingatkan", poin: 5 },
  { id: "pen-main", nama: "Mainan tidak dirapikan", poin: 10 },
  { id: "pen-sopan", nama: "Bicara kurang sopan", poin: 15 },
  { id: "pen-ribut", nama: "Mengganggu atau bertengkar", poin: 20 },
  { id: "pen-jujur", nama: "Tidak jujur", poin: 25 }
];

const fallbackData = {
  schemaVersion: 2,
  today: todayKey(),
  anakAktif: 0,
  penaltyPresets: fallbackPenaltyPresets,
  anak: [
    { id: "anak-ahmad", nama: "Ahmad Firdaus Thabrani", avatarText: "IM", avatarName: "Iron Man", warna: "#dc2626", accent: "#facc15", saldo: 0, tugas: [], harian: {} },
    { id: "anak-silsilia", nama: "Silsilia Raihana Adni", avatarText: "MM", avatarName: "My Melody", warna: "#db2777", accent: "#fecdd3", saldo: 0, tugas: [], harian: {} },
    { id: "anak-aqso", nama: "Muhammad Aqso Darussalam", avatarText: "TAYO", avatarName: "Bus Tayo", warna: "#2563eb", accent: "#60a5fa", saldo: 0, tugas: [], harian: {} }
  ],
  hadiah: [],
  riwayat: []
};

let data = structuredClone(fallbackData);
let selectedDate = todayKey();
let lastGacha = null;
let audioContext = null;
let musicTimer = null;
let isMusicPlaying = false;
let offlineMode = false;

const $ = selector => document.querySelector(selector);

const elements = {
  tabs: $("#anakTabs"),
  playerCard: $("#playerCard"),
  avatar: $("#avatarAktif"),
  nama: $("#namaAnakAktif"),
  poin: $("#poinAnakAktif"),
  total: $("#totalTugas"),
  selesai: $("#tugasSelesai"),
  nilai: $("#nilai"),
  progress: $("#progress"),
  progressText: $("#progressText"),
  grid: $("#gridTombol"),
  tasks: $("#daftarTugas"),
  gifts: $("#daftarHadiah"),
  history: $("#riwayatHadiah"),
  dailyJourney: $("#dailyJourney"),
  penaltyGrid: $("#penaltyGrid"),
  result: $("#hasilGacha"),
  gacha: $("#btnGacha"),
  taskForm: $("#taskForm"),
  giftForm: $("#giftForm"),
  penaltyForm: $("#penaltyForm"),
  taskName: $("#inputTugas"),
  taskIcon: $("#inputIkon"),
  taskPoints: $("#inputPoin"),
  giftName: $("#inputHadiah"),
  penaltyName: $("#inputPenalty"),
  penaltyPoints: $("#inputPenaltyPoin"),
  completeAll: $("#completeAllButton"),
  resetDay: $("#resetDayButton"),
  connectionDot: $("#connectionDot"),
  connectionText: $("#connectionText"),
  lastSaved: $("#lastSaved"),
  todayLabel: $("#todayLabel"),
  musicButton: $("#musicButton"),
  musicIcon: $("#musicIcon"),
  musicLabel: $("#musicLabel")
};

function anakSekarang() {
  return data.anak[data.anakAktif] || data.anak[0];
}

function getDay(child, date = selectedDate) {
  child.harian ||= {};
  child.harian[date] ||= {
    tanggal: date,
    completed: [],
    earned: 0,
    deducted: 0,
    penalties: [],
    gacha: []
  };
  const day = child.harian[date];
  day.completed ||= [];
  day.penalties ||= [];
  day.gacha ||= [];
  day.earned = Number(day.earned || 0);
  day.deducted = Number(day.deducted || 0);
  return day;
}

function normalizeData() {
  data.today ||= todayKey();
  selectedDate = data.today;
  data.penaltyPresets ||= fallbackPenaltyPresets;
  data.anak = data.anak.map((child, index) => {
    const fallback = fallbackData.anak[index] || fallbackData.anak[0];
    child.avatarText = fallback.avatarText;
    child.avatarName = fallback.avatarName;
    child.warna = fallback.warna;
    child.accent = fallback.accent;
    child.saldo = Number.isFinite(Number(child.saldo)) ? Number(child.saldo) : Number(child.poin || 0);
    child.harian ||= {};
    getDay(child, selectedDate);
    delete child.poin;
    child.tugas = (child.tugas || []).map(task => ({
      id: task.id || `task-${Date.now()}-${Math.random()}`,
      nama: task.nama || "Misi",
      ikon: task.ikon || "⭐",
      poin: Number(task.poin || 10)
    }));
    return child;
  });
}

function isiPilihanIkon() {
  elements.taskIcon.innerHTML = ikonPilihan
    .map(ikon => `<option value="${escapeHtml(ikon)}">${escapeHtml(ikon)} ${escapeHtml(ikon)}</option>`)
    .join("");
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.error || "Server tidak merespons.");
  if (payload.data) {
    data = payload.data;
    normalizeData();
    persistLocal();
  }
  return payload;
}

function persistLocal() {
  localStorage.setItem("tombolHadiahState", JSON.stringify(data));
}

function restoreLocal() {
  const saved = localStorage.getItem("tombolHadiahState");
  if (saved) {
    data = JSON.parse(saved);
    normalizeData();
  }
}

async function loadState() {
  restoreLocal();
  render();
  try {
    const payload = await api("/api/state");
    data = payload.data;
    normalizeData();
    offlineMode = false;
    updateConnection(true, "Data terhubung ke server");
  } catch (error) {
    offlineMode = true;
    updateConnection(false, "Mode lokal, backend belum aktif");
  }
  render();
}

function updateConnection(online, text) {
  elements.connectionDot.className = `dot ${online ? "online" : "offline"}`;
  elements.connectionText.textContent = text;
}

function savedNow() {
  elements.lastSaved.textContent = `Tersimpan ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
}

async function mutate(path, options, localChange) {
  if (offlineMode) {
    localChange();
    persistLocal();
    savedNow();
    render();
    return;
  }

  try {
    await api(path, options);
    savedNow();
  } catch (error) {
    alert(error.message);
  }
  render();
}

function render() {
  normalizeData();
  elements.todayLabel.textContent = formatDateOnly(selectedDate);
  renderTabsAnak();
  renderDashboard();
  renderMissions();
  renderPenalties();
  renderTaskList();
  renderGifts();
  renderDailyJourney();
  renderHistory();
  renderGacha();
}

function renderTabsAnak() {
  elements.tabs.innerHTML = data.anak.map((anak, index) => `
    <button class="child-tab ${index === data.anakAktif ? "active" : ""}" style="--accent:${anak.warna}" data-child-index="${index}" type="button">
      <span class="face avatar-mini" style="background:linear-gradient(135deg, ${anak.warna}, ${anak.accent});">${escapeHtml(anak.avatarText)}</span>
      <span>
        <strong>${escapeHtml(shortName(anak.nama))}</strong>
        <span>${anak.saldo} saldo poin</span>
      </span>
    </button>
  `).join("");

  elements.tabs.querySelectorAll("[data-child-index]").forEach(button => {
    button.addEventListener("click", () => setActiveChild(Number(button.dataset.childIndex)));
  });
}

function renderDashboard() {
  const anak = anakSekarang();
  const day = getDay(anak);
  const total = anak.tugas.length;
  const selesai = day.completed.length;
  const net = day.earned - day.deducted;
  const remainder = anak.saldo % 1000;
  const chances = Math.floor(anak.saldo / 1000);
  const gachaProgress = chances > 0 ? 100 : Math.min(100, Math.round((remainder / 1000) * 100));

  elements.playerCard.style.setProperty("--active-color", anak.warna || "#2563eb");
  elements.playerCard.style.setProperty("--active-accent", anak.accent || "#facc15");
  elements.avatar.textContent = anak.avatarText || "⭐";
  elements.avatar.dataset.avatar = anak.avatarName || "";
  elements.nama.textContent = anak.nama;
  elements.poin.textContent = anak.saldo;
  elements.total.textContent = total;
  elements.selesai.textContent = selesai;
  elements.nilai.textContent = net >= 0 ? `+${net}` : `${net}`;
  elements.progress.style.width = `${gachaProgress}%`;
  elements.progressText.textContent = chances > 0
    ? `${chances} kesempatan gacha tersedia`
    : `${remainder} dari 1000 poin`;
}

function renderMissions() {
  const anak = anakSekarang();
  const day = getDay(anak);
  elements.grid.innerHTML = anak.tugas.map(task => {
    const done = day.completed.includes(task.id);
    return `
      <button class="mission-button ${done ? "done" : ""}" data-task-toggle="${task.id}" type="button">
        <span class="mission-icon">${escapeHtml(task.ikon)}</span>
        <span class="mission-name">${escapeHtml(task.nama)}</span>
        <span class="mission-points">${done ? "Selesai" : `${task.poin} poin`}</span>
      </button>
    `;
  }).join("") || `<div class="empty">Belum ada misi untuk anak ini.</div>`;

  elements.grid.querySelectorAll("[data-task-toggle]").forEach(button => {
    button.addEventListener("click", () => toggleTask(button.dataset.taskToggle));
  });
}

function renderPenalties() {
  const presets = data.penaltyPresets || fallbackPenaltyPresets;
  elements.penaltyGrid.innerHTML = presets.map(item => `
    <button class="penalty-button" data-penalty="${item.id}" type="button">
      ${escapeHtml(item.nama)}
      <span>-${item.poin} poin</span>
    </button>
  `).join("");

  elements.penaltyGrid.querySelectorAll("[data-penalty]").forEach(button => {
    const item = presets.find(preset => preset.id === button.dataset.penalty);
    button.addEventListener("click", () => applyPenalty(item.nama, item.poin));
  });
}

function renderTaskList() {
  const anak = anakSekarang();
  const day = getDay(anak);
  elements.tasks.innerHTML = anak.tugas.map(task => {
    const done = day.completed.includes(task.id);
    return `
      <div class="list-row ${done ? "done" : ""}">
        <div>
          <div class="list-title">${escapeHtml(task.ikon)} ${escapeHtml(task.nama)}</div>
          <div class="list-subtitle">${task.poin} poin · ${done ? "selesai hari ini" : "belum selesai"}</div>
        </div>
        <button class="tiny-button" data-task-edit="${task.id}" type="button" title="Edit misi">✎</button>
        <button class="tiny-button danger" data-task-delete="${task.id}" type="button" title="Hapus misi">×</button>
      </div>
    `;
  }).join("") || `<div class="empty">Tambahkan misi pertama.</div>`;

  elements.tasks.querySelectorAll("[data-task-edit]").forEach(button => {
    button.addEventListener("click", () => editTask(button.dataset.taskEdit));
  });
  elements.tasks.querySelectorAll("[data-task-delete]").forEach(button => {
    button.addEventListener("click", () => deleteTask(button.dataset.taskDelete));
  });
}

function renderGifts() {
  elements.gifts.innerHTML = data.hadiah.map(gift => `
    <div class="list-row">
      <div>
        <div class="list-title">🎁 ${escapeHtml(gift.nama)}</div>
      </div>
      <button class="tiny-button" data-gift-edit="${gift.id}" type="button" title="Edit hadiah">✎</button>
      <button class="tiny-button danger" data-gift-delete="${gift.id}" type="button" title="Hapus hadiah">×</button>
    </div>
  `).join("") || `<div class="empty">Belum ada hadiah.</div>`;

  elements.gifts.querySelectorAll("[data-gift-edit]").forEach(button => {
    button.addEventListener("click", () => editGift(button.dataset.giftEdit));
  });
  elements.gifts.querySelectorAll("[data-gift-delete]").forEach(button => {
    button.addEventListener("click", () => deleteGift(button.dataset.giftDelete));
  });
}

function renderDailyJourney() {
  const anak = anakSekarang();
  const dates = Object.keys(anak.harian || {}).sort().reverse().slice(0, 9);
  elements.dailyJourney.innerHTML = dates.map(date => {
    const day = getDay(anak, date);
    const net = day.earned - day.deducted;
    return `
      <article class="daily-card ${date === selectedDate ? "today" : ""}">
        <div class="daily-date">${escapeHtml(formatDateOnly(date))}</div>
        <div class="daily-stats">
          <span><strong>+${day.earned}</strong> didapat</span>
          <span><strong>-${day.deducted}</strong> pengurang</span>
          <span><strong>${net >= 0 ? `+${net}` : net}</strong> bersih</span>
          <span><strong>${day.gacha.length}</strong> gacha</span>
        </div>
      </article>
    `;
  }).join("") || `<div class="empty">Belum ada perjalanan harian.</div>`;
}

function renderHistory() {
  const anak = anakSekarang();
  const history = (data.riwayat || []).filter(item => item.childId === anak.id).slice(0, 8);
  elements.history.innerHTML = history.map(item => `
    <div class="list-row">
      <div>
        <div class="list-title">${escapeHtml(item.childName)} mendapatkan ${escapeHtml(item.hadiah)}</div>
        <div class="list-subtitle">${formatDateOnly(item.tanggal || item.waktu)} · ${formatTime(item.waktu)}</div>
      </div>
    </div>
  `).join("") || `<div class="empty">Belum ada hadiah yang terbuka.</div>`;
}

function renderGacha() {
  const anak = anakSekarang();
  const chances = Math.floor(anak.saldo / 1000);
  elements.gacha.disabled = chances < 1 || data.hadiah.length === 0;
  elements.gacha.querySelector("small").textContent = chances > 0 ? `${chances} kesempatan tersedia` : "Butuh 1000 poin";
  if (lastGacha) {
    elements.result.hidden = false;
    elements.result.innerHTML = `🎉 Selamat, ${escapeHtml(lastGacha.childName)}!<br>Kamu mendapat: <strong>${escapeHtml(lastGacha.hadiah)}</strong>`;
  }
}

async function setActiveChild(index) {
  await mutate("/api/active-child", {
    method: "PUT",
    body: JSON.stringify({ index })
  }, () => {
    data.anakAktif = index;
  });
}

async function toggleTask(taskId) {
  const anak = anakSekarang();
  const day = getDay(anak);
  const task = anak.tugas.find(item => item.id === taskId);
  if (!task) return;
  const done = day.completed.includes(taskId);

  await mutate(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    body: JSON.stringify({ childId: anak.id, date: selectedDate, status: !done })
  }, () => {
    if (done) {
      day.completed = day.completed.filter(id => id !== taskId);
      day.earned = Math.max(0, day.earned - Number(task.poin));
      anak.saldo = Math.max(0, anak.saldo - Number(task.poin));
    } else {
      day.completed.push(taskId);
      day.earned += Number(task.poin);
      anak.saldo += Number(task.poin);
    }
  });
}

async function addTask(event) {
  event.preventDefault();
  const anak = anakSekarang();
  const nama = elements.taskName.value.trim();
  if (!nama) {
    alert("Isi nama misi dulu.");
    return;
  }

  await mutate("/api/tasks", {
    method: "POST",
    body: JSON.stringify({
      childId: anak.id,
      nama,
      ikon: elements.taskIcon.value,
      poin: Number(elements.taskPoints.value)
    })
  }, () => {
    anak.tugas.push({
      id: `task-${Date.now()}`,
      nama,
      ikon: elements.taskIcon.value,
      poin: Number(elements.taskPoints.value)
    });
  });

  elements.taskName.value = "";
}

async function editTask(taskId) {
  const anak = anakSekarang();
  const task = anak.tugas.find(item => item.id === taskId);
  if (!task) return;

  const nama = prompt("Ubah nama misi:", task.nama);
  if (!nama) return;
  const ikon = prompt("Ubah ikon:", task.ikon);
  if (!ikon) return;
  const poin = prompt("Ubah poin:", task.poin);
  if (!poin || Number.isNaN(Number(poin))) {
    alert("Poin harus angka.");
    return;
  }

  await mutate(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    body: JSON.stringify({ childId: anak.id, date: selectedDate, nama, ikon, poin: Number(poin) })
  }, () => {
    task.nama = nama.trim();
    task.ikon = ikon.trim();
    task.poin = Number(poin);
  });
}

async function deleteTask(taskId) {
  const anak = anakSekarang();
  if (!anak.tugas.find(item => item.id === taskId) || !confirm("Hapus misi ini?")) return;

  await mutate(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: "DELETE",
    body: JSON.stringify({ childId: anak.id })
  }, () => {
    anak.tugas = anak.tugas.filter(item => item.id !== taskId);
    Object.values(anak.harian || {}).forEach(day => {
      day.completed = (day.completed || []).filter(id => id !== taskId);
    });
  });
}

async function completeAll() {
  const anak = anakSekarang();
  const day = getDay(anak);
  await mutate("/api/tasks/complete-all", {
    method: "POST",
    body: JSON.stringify({ childId: anak.id, date: selectedDate })
  }, () => {
    anak.tugas.forEach(task => {
      if (!day.completed.includes(task.id)) {
        day.completed.push(task.id);
        day.earned += Number(task.poin);
        anak.saldo += Number(task.poin);
      }
    });
  });
}

async function resetDay() {
  if (!confirm("Reset semua progres hari ini? Poin plus dan pengurang hari ini ikut dikembalikan.")) return;
  const anak = anakSekarang();
  const day = getDay(anak);
  await mutate("/api/tasks/reset-day", {
    method: "POST",
    body: JSON.stringify({ childId: anak.id, date: selectedDate })
  }, () => {
    anak.saldo = Math.max(0, anak.saldo - Number(day.earned || 0) + Number(day.deducted || 0));
    day.completed = [];
    day.earned = 0;
    day.deducted = 0;
    day.penalties = [];
  });
}

async function applyPenalty(nama, poin) {
  const anak = anakSekarang();
  const day = getDay(anak);
  await mutate("/api/penalties", {
    method: "POST",
    body: JSON.stringify({ childId: anak.id, date: selectedDate, nama, poin: Number(poin) })
  }, () => {
    const entry = { id: `penalty-${Date.now()}`, nama, poin: Number(poin), waktu: new Date().toISOString() };
    day.penalties.unshift(entry);
    day.deducted += Number(poin);
    anak.saldo = Math.max(0, anak.saldo - Number(poin));
  });
}

async function addCustomPenalty(event) {
  event.preventDefault();
  const nama = elements.penaltyName.value.trim();
  const poin = Number(elements.penaltyPoints.value);
  if (!nama) {
    alert("Isi alasan pengurang dulu.");
    return;
  }
  await applyPenalty(nama, poin);
  elements.penaltyName.value = "";
}

async function addGift(event) {
  event.preventDefault();
  const nama = elements.giftName.value.trim();
  if (!nama) {
    alert("Isi nama hadiah dulu.");
    return;
  }

  await mutate("/api/gifts", {
    method: "POST",
    body: JSON.stringify({ nama })
  }, () => {
    data.hadiah.push({ id: `gift-${Date.now()}`, nama });
  });

  elements.giftName.value = "";
}

async function editGift(giftId) {
  const gift = data.hadiah.find(item => item.id === giftId);
  if (!gift) return;
  const nama = prompt("Ubah hadiah:", gift.nama);
  if (!nama) return;

  await mutate(`/api/gifts/${encodeURIComponent(giftId)}`, {
    method: "PATCH",
    body: JSON.stringify({ nama })
  }, () => {
    gift.nama = nama.trim();
  });
}

async function deleteGift(giftId) {
  if (!confirm("Hapus hadiah ini?")) return;

  await mutate(`/api/gifts/${encodeURIComponent(giftId)}`, {
    method: "DELETE",
    body: JSON.stringify({})
  }, () => {
    data.hadiah = data.hadiah.filter(item => item.id !== giftId);
  });
}

async function runGacha() {
  const anak = anakSekarang();
  if (anak.saldo < 1000) {
    alert("Poin belum cukup. Kumpulkan 1000 poin dulu.");
    return;
  }
  if (!data.hadiah.length) {
    alert("Daftar hadiah masih kosong.");
    return;
  }

  if (offlineMode) {
    const gift = data.hadiah[Math.floor(Math.random() * data.hadiah.length)];
    const day = getDay(anak);
    anak.saldo -= 1000;
    lastGacha = {
      id: `win-${Date.now()}`,
      childId: anak.id,
      childName: anak.nama,
      hadiah: gift.nama,
      tanggal: selectedDate,
      waktu: new Date().toISOString()
    };
    day.gacha.unshift(lastGacha);
    data.riwayat = [lastGacha, ...(data.riwayat || [])].slice(0, 50);
    persistLocal();
    savedNow();
    render();
    return;
  }

  try {
    const payload = await api("/api/gacha", {
      method: "POST",
      body: JSON.stringify({ childId: anak.id, date: selectedDate })
    });
    lastGacha = payload.hadiah;
    savedNow();
  } catch (error) {
    alert(error.message);
  }
  render();
}

function setupMusic() {
  elements.musicButton.addEventListener("click", toggleMusic);
  document.addEventListener("pointerdown", () => {
    if (!isMusicPlaying) startMusic();
  }, { once: true });
  startMusic();
}

function ensureAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function startMusic() {
  try {
    const context = ensureAudio();
    if (context.state === "suspended") context.resume();
    if (musicTimer) return;
    isMusicPlaying = true;
    updateMusicUi();
    playMelody();
    musicTimer = setInterval(playMelody, 5200);
  } catch (error) {
    isMusicPlaying = false;
    updateMusicUi();
  }
}

function stopMusic() {
  clearInterval(musicTimer);
  musicTimer = null;
  isMusicPlaying = false;
  updateMusicUi();
}

function toggleMusic() {
  if (isMusicPlaying) stopMusic();
  else startMusic();
}

function playMelody() {
  const context = ensureAudio();
  const now = context.currentTime + 0.03;
  const notes = [
    [523.25, 0], [587.33, 0.28], [659.25, 0.56], [523.25, 0.84],
    [523.25, 1.18], [587.33, 1.46], [659.25, 1.74], [523.25, 2.02],
    [659.25, 2.36], [698.46, 2.64], [783.99, 2.92],
    [659.25, 3.3], [698.46, 3.58], [783.99, 3.86],
    [783.99, 4.24], [880, 4.52], [783.99, 4.8], [698.46, 5.08], [659.25, 5.36]
  ];
  notes.forEach(([frequency, offset]) => playTone(context, frequency, now + offset, 0.2));
}

function playTone(context, frequency, start, duration) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.055, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

function updateMusicUi() {
  elements.musicButton.classList.toggle("playing", isMusicPlaying);
  elements.musicIcon.textContent = isMusicPlaying ? "♫" : "♪";
  elements.musicLabel.textContent = isMusicPlaying ? "Nyala" : "Musik";
}

function todayKey() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = formatter.formatToParts(new Date());
  const pick = type => parts.find(part => part.type === type).value;
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

function shortName(name) {
  return name.split(" ").slice(0, 2).join(" ");
}

function formatDateOnly(value) {
  if (!value) return "";
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00+07:00`);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta"
  });
}

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta"
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

elements.taskForm.addEventListener("submit", addTask);
elements.giftForm.addEventListener("submit", addGift);
elements.penaltyForm.addEventListener("submit", addCustomPenalty);
elements.completeAll.addEventListener("click", completeAll);
elements.resetDay.addEventListener("click", resetDay);
elements.gacha.addEventListener("click", runGacha);

isiPilihanIkon();
setupMusic();
loadState();
