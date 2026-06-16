window.TOMBOL_HADIAH_API_URL = "https://script.google.com/macros/s/AKfycbwSnEa7uD7uLROxC9VU1aWgZcfg295X8Bz5H6K3CDU8A2SZ4YKtdrli4GVHk9vchThD/exec";

(function setupPwa() {
  const manifest = document.createElement("link");
  manifest.rel = "manifest";
  manifest.href = "manifest.webmanifest";
  document.head.appendChild(manifest);

  const theme = document.createElement("meta");
  theme.name = "theme-color";
  theme.content = "#facc15";
  document.head.appendChild(theme);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
