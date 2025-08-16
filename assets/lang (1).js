(function () {
  try {
    var CONFIG = {
      enPath: "/",
      frPath: "/fr/",
      defaultLang: "en",    // fallback if FR page isn't deployed
      checkExists: true,    // verify target exists before redirecting
      timeoutMs: 800        // max wait for HEAD check
    };

    var LS_KEY = "site_lang";
    var path = (location.pathname || "/");
    // normalize (ensure trailing slash for comparison)
    function norm(p) { return (p || "/").replace(/\/+$/,"/"); }
    var isFR = norm(path).startsWith(norm(CONFIG.frPath));
    var isEN = norm(path) === norm(CONFIG.enPath);

    // Helpers
    function setPref(lang) { try { localStorage.setItem(LS_KEY, lang); } catch(e) {} }
    function getPref() { try { return localStorage.getItem(LS_KEY); } catch(e) { return null; } }
    function wantsFRByNavigator() {
      var navLang = ((navigator.languages && navigator.languages[0]) || navigator.language || "").toLowerCase();
      return /^fr\b/.test(navLang);
    }
    function buildTarget(base) { return base + (location.search || "") + (location.hash || ""); }
    function exists(url) {
      if (!CONFIG.checkExists) return Promise.resolve(true);
      var done = false;
      return new Promise(function(resolve) {
        var to = setTimeout(function(){ if(!done){ done=true; resolve(false);} }, CONFIG.timeoutMs);
        fetch(url, { method:"HEAD", cache:"no-store", redirect:"follow" })
          .then(function(r){ if(!done){ done=true; clearTimeout(to); resolve(!!(r && (r.ok || r.status===304))); } })
          .catch(function(){ if(!done){ done=true; clearTimeout(to); resolve(false); } });
      });
    }

    // Query override ?lang=en|fr (also accepts #lang=)
    var override = (new URLSearchParams(location.search).get("lang") || (location.hash.match(/(?:^|[#&])lang=(en|fr)\b/i)||[])[1] || "").toLowerCase();
    if (override === "en" || override === "fr") {
      setPref(override);
      var target = override === "fr" ? CONFIG.frPath : CONFIG.enPath;
      if (norm(path) !== norm(target)) {
        exists(target).then(function(ok){
          if (!ok && override === "fr") { // fallback to EN if FR missing
            setPref("en");
            location.replace(buildTarget(CONFIG.enPath));
          } else {
            location.replace(buildTarget(target));
          }
        });
        return;
      }
    }

    var pref = getPref();
    // Decide desired lang
    var desired = pref || (wantsFRByNavigator() ? "fr" : CONFIG.defaultLang);

    // If already on the right section, do nothing
    if ((desired === "fr" && isFR) || (desired === "en" && isEN)) return;

    // Compute target path
    var targetPath = (desired === "fr") ? CONFIG.frPath : CONFIG.enPath;

    // Avoid redirect loops; verify existence before redirecting
    exists(targetPath).then(function(ok){
      if (!ok) {
        // If FR missing, fallback to EN and store preference to EN
        if (desired === "fr") setPref("en");
        return; // stay on current page to avoid blank
      }
      location.replace(buildTarget(targetPath));
    });

    // Memorize clicks on EN/FR
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[hreflang], a[href="/"], a[href="/fr/"]');
      if (!a) return;
      var hl = (a.getAttribute("hreflang") || "").toLowerCase();
      if (hl) {
        setPref(hl.split("-")[0]);
      } else {
        if (a.getAttribute("href") === norm(CONFIG.frPath)) setPref("fr");
        if (a.getAttribute("href") === norm(CONFIG.enPath)) setPref("en");
      }
    });
  } catch (e) {
    // no-op (never block rendering)
  }
})();