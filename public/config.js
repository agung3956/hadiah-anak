window.TOMBOL_HADIAH_API_URL = "https://script.google.com/macros/s/AKfycbwSnEa7uD7uLROxC9VU1aWgZcfg295X8Bz5H6K3CDU8A2SZ4YKtdrli4GVHk9vchThD/exec";

(function setupPwa() {
  const manifest = document.createElement("link");
  manifest.rel = "manifest";
  manifest.href = "manifest.webmanifest";
  document.head.appendChild(manifest);

  const icon = document.createElement("link");
  icon.rel = "icon";
  icon.type = "image/svg+xml";
  icon.href = "favicon.svg";
  document.head.appendChild(icon);

  const appleIcon = document.createElement("link");
  appleIcon.rel = "apple-touch-icon";
  appleIcon.href = "icon.svg";
  document.head.appendChild(appleIcon);

  const theme = document.createElement("meta");
  theme.name = "theme-color";
  theme.content = "#facc15";
  document.head.appendChild(theme);

  window.addEventListener("load", () => {
    const fastUx = document.createElement("script");
    fastUx.src = "instant-ux.js";
    document.body.appendChild(fastUx);
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
