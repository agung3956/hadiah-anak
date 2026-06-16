(function () {
  function todayKey() {
    const f = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" });
    const p = f.formatToParts(new Date());
    const v = t => p.find(x => x.type === t).value;
    return v("year") + "-" + v("month") + "-" + v("day");
  }

  function formatDate(value) {
    return new Date(value + "T00:00:00+07:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
  }

  function waitForApp() {
    const grid = document.getElementById("dailyJourney");
    if (!grid) return setTimeout(waitForApp, 300);
    enhance(grid);
  }

  function enhance(grid) {
    const original = window.renderDailyJourney;
    if (typeof original !== "function") return setTimeout(() => enhance(grid), 300);

    window.renderDailyJourney = function () {
      original();
      addHistoryActions(grid);
    };

    addDateTools(grid);
    addHistoryActions(grid);
  }

  function addDateTools(grid) {
    if (document.getElementById("historyDateTools")) return;
    const panel = document.createElement("div");
    panel.id = "historyDateTools";
    panel.className = "history-date-tools";
    panel.innerHTML = '<button class="primary-button" id="todayDateButton" type="button">Hari Ini</button><input id="manualDateInput" type="date"><button class="primary-button" id="openDateButton" type="button">Buka Tanggal</button>';
    grid.parentElement.insertBefore(panel, grid);
    document.getElementById("todayDateButton").addEventListener("click", () => openDate(todayKey()));
    document.getElementById("openDateButton").addEventListener("click", () => {
      const value = document.getElementById("manualDateInput").value;
      if (value) openDate(value);
    });
  }

  function addHistoryActions(grid) {
    const cards = grid.querySelectorAll(".daily-card");
    cards.forEach(card => {
      if (card.dataset.clickReady) return;
      const label = card.querySelector(".daily-date");
      if (!label) return;
      const date = findDateFromLabel(label.textContent);
      if (!date) return;
      card.dataset.clickReady = "1";
      card.style.cursor = "pointer";
      card.title = "Klik untuk mengisi tanggal ini";
      card.addEventListener("click", () => openDate(date));
    });
  }

  function findDateFromLabel(text) {
    const state = JSON.parse(localStorage.getItem("tombolHadiahState") || "null");
    if (!state || !state.anak) return "";
    const child = state.anak[state.anakAktif] || state.anak[0];
    return Object.keys(child.harian || {}).find(date => formatDate(date) === text.trim()) || "";
  }

  function openDate(date) {
    if (typeof selectedDate !== "undefined") {
      selectedDate = date;
      const child = anakSekarang();
      getDay(child, date);
      if (typeof render === "function") render();
      const input = document.getElementById("manualDateInput");
      if (input) input.value = date;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  window.addEventListener("load", waitForApp);
})();
