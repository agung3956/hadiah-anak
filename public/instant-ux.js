(function () {
  function installInstantMutate() {
    if (typeof mutate !== "function" || typeof render !== "function") {
      setTimeout(installInstantMutate, 200);
      return;
    }

    const originalMutate = mutate;

    mutate = async function instantMutate(path, options, localChange) {
      try {
        if (typeof localChange === "function") localChange();
        if (typeof persistLocal === "function") persistLocal();
        if (typeof savedNow === "function") savedNow();
        if (typeof render === "function") render();
      } catch (error) {
        alert(error.message || "Perubahan lokal gagal.");
        return;
      }

      try {
        const hasRemote = typeof remoteApiUrl !== "undefined" && remoteApiUrl;
        const isOnlineMode = typeof offlineMode === "undefined" || !offlineMode;
        if (hasRemote && isOnlineMode && typeof api === "function") {
          await api(path, options);
          if (typeof savedNow === "function") savedNow();
        }
      } catch (error) {
        if (typeof updateConnection === "function") updateConnection(false, "Mode lokal, sinkron nanti");
      }
    };

    window.TOMBOL_HADIAH_FAST_CLICK = true;
  }

  window.addEventListener("load", installInstantMutate);
})();
