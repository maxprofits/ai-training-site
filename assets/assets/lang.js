(function () {
  try {
    var LS_KEY = "site_lang";
    var path = location.pathname || "/";
    var isFR = path.startsWith("/fr/");
    var pref = null;

    try { pref = localStorage.getItem(LS_KEY); } catch(e) {}

    function setPref(lang) {
      try { localStorage.setItem(LS_KEY, lang); } catch(e) {}
    }

    // 1) Redirection automatique (une seule fois si aucune préférence enregistrée)
    if (!pref) {
      var navLang = ((navigator.languages && navigator.languages[0]) || navigator.language || "").toLowerCase();
      var wantsFR = /^fr\b/.test(navLang);

      if (wantsFR && !isFR) {
        location.replace("/fr/" + (location.search || "") + (location.hash || ""));
        return;
      }
      if (!wantsFR && isFR) {
        location.replace("/" + (location.search || "") + (location.hash || ""));
        return;
      }
    } else {
      // 2) Respecter la préférence enregistrée
      if (pref === "fr" && !isFR) {
        location.replace("/fr/" + (location.search || "") + (location.hash || ""));
        return;
      }
      if (pref === "en" && isFR) {
        location.replace("/" + (location.search || "") + (location.hash || ""));
        return;
      }
    }

    // 3) Mémoriser le choix quand on clique sur EN/FR
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[hreflang], a[href="/"], a[href="/fr/"]');
      if (!a) return;
      var hl = (a.getAttribute("hreflang") || "").toLowerCase();
      if (hl) {
        setPref(hl.split("-")[0]); // "fr-FR" -> "fr"
      } else {
        if (a.getAttribute("href") === "/fr/") setPref("fr");
        if (a.getAttribute("href") === "/") setPref("en");
      }
    });
  } catch (e) {
    // no-op
  }
})();
