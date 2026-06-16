(function () {
  let activeDate = "";

  function todayKeyLocal() {
    const f = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" });
    const p = f.formatToParts(new Date());
    const v = t => p.find(x => x.type === t).value;
    return v("year") + "-" + v("month") + "-" + v("day");
  }

  function readActiveDate() {
    try {
      return selectedDate || activeDate || localStorage.getItem("tombolHadiahSelectedDate") || todayKeyLocal();
    } catch (error) {
      return activeDate || localStorage.getItem("tombolHadiahSelectedDate") || todayKeyLocal();
    }
  }

  function writeActiveDate(date) {
    activeDate = date || todayKeyLocal();
    localStorage.setItem("tombolHadiahSelectedDate", activeDate);
    try {
      selectedDate = activeDate;
    } catch (error) {}
  }

  function patchNormalize() {
    if (typeof normalizeData !== "function") return false;
    if (window.TOMBOL_HADIAH_DATE_PATCHED) return true;
    const originalNormalize = normalizeData;
    normalizeData = function () {
      const keepDate = readActiveDate();
      originalNormalize();
      writeActiveDate(keepDate);
      try {
        const child = anakSekarang();
        getDay(child, keepDate);
      } catch (error) {}
    };
    window.TOMBOL_HADIAH_DATE_PATCHED = true;
    return true;
  }

  function patchOpeners() {
    window.tombolHadiahOpenDate = function (date) {
      writeActiveDate(date);
      try {
        const child = anakSekarang();
        getDay(child, date);
      } catch (error) {}
      try {
        if (typeof render === "function") render();
      } catch (error) {}
      try {
        document.body.dataset.menu = "misi";
        localStorage.setItem("tombolHadiahMenu", "misi");
      } catch (error) {}
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }

  function patchHistoryCards() {
    const grid = document.getElementById("dailyJourney");
    if (!grid) return;
    grid.addEventListener("click", event => {
      const card = event.target.closest(".daily-card");
      if (!card) return;
      const label = card.querySelector(".daily-date");
      if (!label) return;
      const state = JSON.parse(localStorage.getItem("tombolHadiahState") || "null");
      if (!state || !state.anak) return;
      const child = state.anak[state.anakAktif] || state.anak[0];
      const dates = Object.keys(child.harian || {});
      const target = dates.find(date => {
        const text = new Date(date + "T00:00:00+07:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
        return text === label.textContent.trim();
      });
      if (target) window.tombolHadiahOpenDate(target);
    });
  }

  function start() {
    writeActiveDate(localStorage.getItem("tombolHadiahSelectedDate") || todayKeyLocal());
    if (!patchNormalize()) return setTimeout(start, 200);
    patchOpeners();
    patchHistoryCards();
    try {
      if (typeof render === "function") render();
    } catch (error) {}
  }

  window.addEventListener("load", start);
})();
