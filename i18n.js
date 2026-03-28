'use strict';

(function () {
  var SUPPORTED = ['en', 'es', 'zh', 'ja', 'fr', 'de'];

  // Resolve initial language: saved → browser → English
  var saved       = localStorage.getItem('lang');
  var browserLang = (navigator.language || '').slice(0, 2).toLowerCase();

  window.__lang = SUPPORTED.indexOf(saved) !== -1        ? saved
               : SUPPORTED.indexOf(browserLang) !== -1   ? browserLang
               : 'en';

  // ── Translation lookup ─────────────────────────────────────────────────────
  // t('key')            → translated string
  // t('key', {n: 3})    → translated string with {n} replaced by 3
  window.t = function (key, vars) {
    var dict = window.TRANSLATIONS;
    var lang = window.__lang;
    var str  = (dict[lang] && dict[lang][key] !== undefined)
               ? dict[lang][key]
               : (dict['en'][key] !== undefined ? dict['en'][key] : key);
    if (vars) {
      str = str.replace(/\{(\w+)\}/g, function (_, k) {
        return vars[k] !== undefined ? vars[k] : '';
      });
    }
    return str;
  };

  // ── Apply language change ──────────────────────────────────────────────────
  window.setLang = function (lang) {
    if (SUPPORTED.indexOf(lang) === -1) return;
    window.__lang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.setAttribute('lang', lang);

    // Update all static [data-i18n] text nodes
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = window.t(el.getAttribute('data-i18n'));
    });

    // Re-render the dynamic result card and timestamp
    window.dispatchEvent(new Event('langchange'));
  };

  // Apply lang attribute immediately (before DOM fully painted)
  document.documentElement.setAttribute('lang', window.__lang);
})();
