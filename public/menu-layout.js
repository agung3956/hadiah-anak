(function () {
  const menus = [
    ["dashboard", "🏠", "Ringkas"],
    ["misi", "✅", "Misi"],
    ["hadiah", "🎁", "Hadiah"],
    ["history", "📅", "History"],
    ["atur", "⚙️", "Atur"]
  ];

  function todayKeyLocal() {
    const f = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" });
    const p = f.formatToParts(new Date());
    const v = t => p.find(x => x.type === t).value;
    return v("year") + "-" + v("month") + "-" + v("day");
  }

  function formatLocalDate(value) {
    if (!value) return "";
    return new Date(value + "T00:00:00+07:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
  }

  function setMenu(name) {
    document.body.dataset.menu = name;
    localStorage.setItem("tombolHadiahMenu", name);
    document.querySelectorAll(".menu-tab").forEach(btn => btn.classList.toggle("active", btn.dataset.menuTarget === name));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getActiveDate() {
    try {
      if (typeof selectedDate !== "undefined") return selectedDate;
    } catch (error) {}
    return todayKeyLocal();
  }

  function openDate(value) {
    if (!value) return;
    try {
      selectedDate = value;
      const child = anakSekarang();
      getDay(child, value);
      if (typeof render === "function") render();
    } catch (error) {}
    refreshDateContext();
    setMenu("misi");
  }

  function refreshDateContext() {
    const date = getActiveDate();
    const today = todayKeyLocal();
    const title = document.getElementById("activeDateTitle");
    const subtitle = document.getElementById("activeDateSubtitle");
    const input = document.getElementById("activeDateInput");
    if (!title || !subtitle || !input) return;
    input.value = date;
    title.textContent = date === today ? "Mengisi: Hari Ini" : "Mengisi: Tanggal Lama";
    subtitle.textContent = formatLocalDate(date) + (date === today ? "" : " · data akan masuk ke tanggal ini");
  }

  function installDateContext(shell) {
    if (document.getElementById("dateContextPanel")) return;
    const panel = document.createElement("section");
    panel.id = "dateContextPanel";
    panel.className = "date-context-panel";
    panel.innerHTML = '<div><div class="date-context-title" id="activeDateTitle">Mengisi: Hari Ini</div><div class="date-context-subtitle" id="activeDateSubtitle"></div></div><input id="activeDateInput" type="date"><button class="primary-button" id="backTodayButton" type="button">Hari Ini</button>';
    const target = document.querySelector(".penalty-panel") || document.querySelector(".mission-board");
    shell.insertBefore(panel, target);
    document.getElementById("activeDateInput").addEventListener("change", e => openDate(e.target.value));
    document.getElementById("backTodayButton").addEventListener("click", () => openDate(todayKeyLocal()));
    refreshDateContext();
  }

  function installMenu() {
    const shell = document.querySelector(".app-shell");
    const tabs = document.getElementById("anakTabs");
    if (!shell || !tabs) return setTimeout(installMenu, 250);
    if (document.getElementById("appMenu")) return;

    const nav = document.createElement("nav");
    nav.id = "appMenu";
    nav.className = "app-menu";
    nav.setAttribute("aria-label", "Menu aplikasi");
    nav.innerHTML = menus.map(([key, icon, label]) => '<button class="menu-tab" type="button" data-menu-target="' + key + '"><span>' + icon + '</span><small>' + label + '</small></button>').join("");
    tabs.after(nav);
    nav.querySelectorAll(".menu-tab").forEach(btn => btn.addEventListener("click", () => setMenu(btn.dataset.menuTarget)));
    installDateContext(shell);
    setMenu(localStorage.getItem("tombolHadiahMenu") || "dashboard");

    const originalRender = window.render;
    if (typeof originalRender === "function") {
      window.render = function () {
        originalRender();
        refreshDateContext();
      };
    }
  }

  window.addEventListener("load", installMenu);
})();
