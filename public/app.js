const ikonPilihan = [
  "🕌", "📖", "🎧", "🏠", "🧹", "🧽", "📚", "👕", "🌱", "🗑️",
  "🍚", "🛒", "🥛", "🛏️", "🪥", "🚿", "🧸", "⭐", "🎨", "⚽",
  "🚲", "💪", "🍎", "🎒", "✅", "💡", "🎁", "🍬", "🎮", "📺"
];

const fallbackData = {
  anakAktif: 0,
  anak: [
    { id: "anak-ahmad", nama: "Ahmad Firdaus Thabrani", avatar: "🚀", warna: "#2563eb", poin: 0, tugas: [] },
    { id: "anak-silsilia", nama: "Silsilia Raihana Adni", avatar: "🌈", warna: "#db2777", poin: 0, tugas: [] },
    { id: "anak-aqso", nama: "Muhammad Aqso Darussalam", avatar: "⚽", warna: "#16a34a", poin: 0, tugas: [] }
  ],
  hadiah: [],
  riwayat: []
};

let data = structuredClone(fallbackData);
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
  result: $("#hasilGacha"),
  gacha: $("#btnGacha"),
  taskForm: $("#taskForm"),
  giftForm: $("#giftForm"),
  taskName: $("#inputTugas"),
  taskIcon: $("#inputIkon"),
  taskPoints: $("#inputPoin"),
  giftName: $("#inputHadiah"),
  completeAll: $("#completeAllButton"),
  resetDay: $("#resetDayButton"),
  connectionDot: $("#connectionDot"),
  connectionText: $("#connectionText"),
  lastSaved: $("#lastSaved"),
  musicButton: $("#musicButton"),
  musicIcon: $("#musicIcon"),
  musicLabel: $("#musicLabel")
};

function anakSekarang() {
  return data.anak[data.anakAktif] || data.anak[0];
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
    persistLocal();
  }
  return payload;
}

function persistLocal() {
  localStorage.setItem("tombolHadiahState", JSON.stringify(data));
}

function restoreLocal() {
  const saved = localStorage.getItem("tombolHadiahState");
  if (saved) data = JSON.parse(saved);
}

async function loadState() {
  restoreLocal();
  render();
  try {
    const payload = await api("/api/state");
    data = payload.data;
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
  renderTabsAnak();
  renderDashboard();
  renderMissions();
  renderTaskList();
  renderGifts();
  renderHistory();
  renderGacha();
}

function renderTabsAnak() {
  elements.tabs.innerHTML = data.anak.map((anak, index) => `
    <button class="child-tab ${index === data.anakAktif ? "active" : ""}" style="--accent:${anak.warna}" data-child-index="${index}" type="button">
      <span class="face">${escapeHtml(anak.avatar)}</span>
      <span>
        <strong>${escapeHtml(shortName(anak.nama))}</strong>
        <span>${anak.poin} poin</span>
      </span>
    </button>
  `).join("");

  elements.tabs.querySelectorAll("[data-child-index]").forEach(button => {
    button.addEventListener("click", () => setActiveChild(Number(button.dataset.childIndex)));
  });
}

function renderDashboard() {
  const anak = anakSekarang();
  const total = anak.tugas.length;
  const selesai = anak.tugas.filter(item => item.status).length;
  const nilai = total === 0 ? 0 : Math.round((selesai / total) * 100);
  const gachaProgress = Math.min(100, Math.round((anak.poin / 1000) * 100));

  elements.playerCard.style.setProperty("--active-color", anak.warna || "#2563eb");
  elements.avatar.textContent = anak.avatar || "⭐";
  elements.nama.textContent = anak.nama;
  elements.poin.textContent = anak.poin;
  elements.total.textContent = total;
  elements.selesai.textContent = selesai;
  elements.nilai.textContent = `${nilai}%`;
  elements.progress.style.width = `${gachaProgress}%`;
  elements.progressText.textContent = `${anak.poin} dari 1000 poin`;
}

function renderMissions() {
  const anak = anakSekarang();
  elements.grid.innerHTML = anak.tugas.map(task => `
    <button class="mission-button ${task.status ? "done" : ""}" data-task-toggle="${task.id}" type="button">
      <span class="mission-icon">${escapeHtml(task.ikon)}</span>
      <span class="mission-name">${escapeHtml(task.nama)}</span>
      <span class="mission-points">${task.status ? "Selesai" : `${task.poin} poin`}</span>
    </button>
  `).join("") || `<div class="empty">Belum ada misi untuk anak ini.</div>`;

  elements.grid.querySelectorAll("[data-task-toggle]").forEach(button => {
    button.addEventListener("click", () => toggleTask(button.dataset.taskToggle));
  });
}

function renderTaskList() {
  const anak = anakSekarang();
  elements.tasks.innerHTML = anak.tugas.map(task => `
    <div class="list-row ${task.status ? "done" : ""}">
      <div>
        <div class="list-title">${escapeHtml(task.ikon)} ${escapeHtml(task.nama)}</div>
        <div class="list-subtitle">${task.poin} poin</div>
      </div>
      <button class="tiny-button" data-task-edit="${task.id}" type="button" title="Edit misi">✎</button>
      <button class="tiny-button danger" data-task-delete="${task.id}" type="button" title="Hapus misi">×</button>
    </div>
  `).join("") || `<div class="empty">Tambahkan misi pertama.</div>`;

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

function renderHistory() {
  elements.history.innerHTML = (data.riwayat || []).slice(0, 6).map(item => `
    <div class="list-row">
      <div>
        <div class="list-title">${escapeHtml(item.childName)} mendapatkan ${escapeHtml(item.hadiah)}</div>
        <div class="list-subtitle">${formatDate(item.waktu)}</div>
      </div>
    </div>
  `).join("") || `<div class="empty">Belum ada hadiah yang terbuka.</div>`;
}

function renderGacha() {
  const anak = anakSekarang();
  elements.gacha.disabled = anak.poin < 1000 || data.hadiah.length === 0;
  elements.gacha.querySelector("small").textContent = anak.poin >= 1000 ? "Siap dibuka" : "Butuh 1000 poin";
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
  const task = anak.tugas.find(item => item.id === taskId);
  if (!task) return;

  await mutate(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    body: JSON.stringify({ childId: anak.id, status: !task.status })
  }, () => {
    task.status = !task.status;
    anak.poin += task.status ? Number(task.poin) : -Number(task.poin);
    if (anak.poin < 0) anak.poin = 0;
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
      poin: Number(elements.taskPoints.value),
      status: false
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
    body: JSON.stringify({ childId: anak.id, nama, ikon, poin: Number(poin) })
  }, () => {
    task.nama = nama.trim();
    task.ikon = ikon.trim();
    task.poin = Number(poin);
  });
}

async function deleteTask(taskId) {
  const anak = anakSekarang();
  const task = anak.tugas.find(item => item.id === taskId);
  if (!task || !confirm("Hapus misi ini?")) return;

  await mutate(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: "DELETE",
    body: JSON.stringify({ childId: anak.id })
  }, () => {
    if (task.status) anak.poin = Math.max(0, anak.poin - Number(task.poin));
    anak.tugas = anak.tugas.filter(item => item.id !== taskId);
  });
}

async function completeAll() {
  const anak = anakSekarang();
  await mutate("/api/tasks/complete-all", {
    method: "POST",
    body: JSON.stringify({ childId: anak.id })
  }, () => {
    anak.tugas.forEach(task => {
      if (!task.status) {
        task.status = true;
        anak.poin += Number(task.poin);
      }
    });
  });
}

async function resetDay() {
  if (!confirm("Reset status misi hari ini? Poin tetap disimpan.")) return;
  const anak = anakSekarang();
  await mutate("/api/tasks/reset-day", {
    method: "POST",
    body: JSON.stringify({ childId: anak.id })
  }, () => {
    anak.tugas = anak.tugas.map(task => ({ ...task, status: false }));
  });
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
  if (anak.poin < 1000) {
    alert("Poin belum cukup. Kumpulkan 1000 poin dulu.");
    return;
  }
  if (!data.hadiah.length) {
    alert("Daftar hadiah masih kosong.");
    return;
  }

  if (offlineMode) {
    const gift = data.hadiah[Math.floor(Math.random() * data.hadiah.length)];
    anak.poin -= 1000;
    lastGacha = {
      id: `win-${Date.now()}`,
      childId: anak.id,
      childName: anak.nama,
      hadiah: gift.nama,
      waktu: new Date().toISOString()
    };
    data.riwayat = [lastGacha, ...(data.riwayat || [])].slice(0, 20);
    persistLocal();
    savedNow();
    render();
    return;
  }

  try {
    const payload = await api("/api/gacha", {
      method: "POST",
      body: JSON.stringify({ childId: anak.id })
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
  if (isMusicPlaying) {
    stopMusic();
  } else {
    startMusic();
  }
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

function shortName(name) {
  return name.split(" ").slice(0, 2).join(" ");
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
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
elements.completeAll.addEventListener("click", completeAll);
elements.resetDay.addEventListener("click", resetDay);
elements.gacha.addEventListener("click", runGacha);

isiPilihanIkon();
setupMusic();
loadState();
