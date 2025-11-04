// Clean i18n configuration for browser
// Provides a single, reliable initialization and minimal global helpers

(function() {
  async function initI18next() {
    try {
      // Ensure i18next is available
      if (typeof window.i18next === 'undefined') {
        console.error('i18next is not loaded. Check CDN script tags.');
        return;
      }

      // Optional plugins
      if (typeof window.i18nextBrowserLanguageDetector !== 'undefined') {
        window.i18next.use(window.i18nextBrowserLanguageDetector);
      }
      if (typeof window.I18nextLocalStorageBackend !== 'undefined') {
        window.i18next.use(window.I18nextLocalStorageBackend);
      }

      await window.i18next.init({
        debug: true,
        fallbackLng: 'en',
        load: 'languageOnly',
        backend: {
          loadPath: '/api/i18n/translations/{{lng}}/{{ns}}',
          addPath: '/api/i18n/translations/{{lng}}/{{ns}}',
          expirationTime: 7 * 24 * 60 * 60 * 1000,
          defaultVersion: 'v1.0'
        },
        detection: {
          order: ['localStorage', 'navigator', 'htmlTag'],
          lookupLocalStorage: 'i18nextLng',
          caches: ['localStorage'],
          excludeCacheFor: ['cimode']
        },
        interpolation: {
          escapeValue: false,
          formatSeparator: ',',
          format: function(value, formatting, lng) {
            if (value instanceof Date) {
              return value.toLocaleDateString(lng);
            }
            return value;
          }
        },
        ns: ['common', 'workflow'],
        defaultNS: 'common',
        pluralSeparator: '_',
        contextSeparator: '_',
        preload: ['en'],
        partialBundledLanguages: true,
        saveMissing: true,
        saveMissingTo: 'all'
      });

      document.documentElement.lang = window.i18next.language;
      document.documentElement.setAttribute('data-language', window.i18next.language);

      document.dispatchEvent(new CustomEvent('i18next:initialized', {
        detail: { language: window.i18next.language }
      }));

      console.log('i18next initialized:', window.i18next.language);
    } catch (err) {
      console.error('Failed to initialize i18next:', err);
    }
  }

  function t(key, options) {
    if (!window.i18next) return key;
    try { return window.i18next.t(key, options || {}); } catch { return key; }
  }

  function changeLanguage(lng) {
    if (!window.i18next) return Promise.resolve(false);
    return window.i18next.changeLanguage(lng).then(() => {
      document.documentElement.lang = window.i18next.language;
      document.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { newLanguage: window.i18next.language, previousLanguage: lng }
      }));
      return true;
    }).catch(err => { console.error('changeLanguage error:', err); return false; });
  }

  function getCurrentLanguage() {
    if (!window.i18next) return 'en';
    return window.i18next.language || (window.i18next.languages && window.i18next.languages[0]) || 'en';
  }

  window.i18n = {
    initI18next,
    t,
    changeLanguage,
    getCurrentLanguage
  };
})();