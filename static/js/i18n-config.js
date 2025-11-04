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

      // Load translations directly from JSON files as fallback
      const loadTranslations = async (lng) => {
        try {
          const response = await fetch(`/static/locales/${lng}/translation.json`);
          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.warn(`Failed to load translations for ${lng}:`, error);
        }
        return null;
      };

      // Load English translations as base
      const enTranslations = await loadTranslations('en') || {};
      const zhTranslations = await loadTranslations('zh') || {};

      // Optional plugins
      if (typeof window.i18nextBrowserLanguageDetector !== 'undefined') {
        window.i18next.use(window.i18nextBrowserLanguageDetector);
      }
      if (typeof window.I18nextLocalStorageBackend !== 'undefined') {
        window.i18next.use(window.I18nextLocalStorageBackend);
      }
      if (typeof window.i18nextHttpBackend !== 'undefined') {
        window.i18next.use(window.i18nextHttpBackend);
      }

      const initOptions = {
        debug: true,
        fallbackLng: 'en',
        load: 'languageOnly',
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
        resources: {
          en: {
            translation: enTranslations
          },
          zh: {
            translation: zhTranslations
          }
        }
      };

      // Only add backend configuration if backend is available
      if (typeof window.I18nextLocalStorageBackend !== 'undefined') {
        initOptions.backend = {
          loadPath: '/api/i18n/translations/{{lng}}/{{ns}}',
          addPath: '/api/i18n/translations/{{lng}}/{{ns}}',
          expirationTime: 7 * 24 * 60 * 60 * 1000,
          defaultVersion: 'v1.0'
        };
      }

      // Only add saveMissing if backend is available
      if (typeof window.I18nextLocalStorageBackend !== 'undefined') {
        initOptions.saveMissing = true;
        initOptions.saveMissingTo = 'all';
      }

      await window.i18next.init(initOptions);

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