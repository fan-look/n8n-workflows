(function(){
  // 将 UI 标准暴露为浏览器全局，避免 ESM 语法
  window.I18N_UI_STANDARDS = {
    buttons: {
      primary: {
        base: {
          padding: '8px 16px', fontSize: '14px', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease', fontWeight: '500', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
        },
        variants: {
          default: { backgroundColor: 'var(--primary, #3b82f6)', color: 'white', '&:hover': { backgroundColor: 'var(--primary-dark, #2563eb)' } },
          secondary: { backgroundColor: 'transparent', color: 'var(--primary, #3b82f6)', border: '1px solid var(--primary, #3b82f6)', '&:hover': { backgroundColor: 'var(--primary, #3b82f6)', color: 'white' } }
        }
      },
      langSwitch: {
        base: { position: 'fixed', top: '20px', right: '20px', zIndex: '1000', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px', padding: '8px 12px', backgroundColor: 'var(--bg-secondary, #f8fafc)', border: '1px solid var(--border, #e2e8f0)', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: 'var(--text, #1e293b)', transition: 'all 0.2s ease', boxShadow: 'var(--shadow, 0 1px 3px 0 rgb(0 0 0 / 0.1))' },
        hover: { backgroundColor: 'var(--bg-tertiary, #f1f5f9)', borderColor: 'var(--primary, #3b82f6)', transform: 'translateY(-1px)', boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1))' },
        active: { backgroundColor: 'var(--primary, #3b82f6)', color: 'white', borderColor: 'var(--primary, #3b82f6)' }
      }
    },
    languageSelector: {
      container: { position: 'absolute', top: '100%', right: '0', marginTop: '8px', backgroundColor: 'var(--bg, #ffffff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: '8px', boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1))', padding: '8px 0', minWidth: '180px', maxHeight: '300px', overflowY: 'auto', zIndex: '1001', backdropFilter: 'blur(8px)' },
      option: { base: { display: 'flex', alignItems: 'center', padding: '10px 16px', cursor: 'pointer', fontSize: '14px', color: 'var(--text, #1e293b)', transition: 'background-color 0.2s ease', gap: '12px' }, hover: { backgroundColor: 'var(--bg-secondary, #f8fafc)' }, selected: { backgroundColor: 'var(--primary, #3b82f6)', color: 'white' } },
      flag: { width: '20px', height: '15px', borderRadius: '2px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
      text: { flex: '1', fontWeight: '500' },
      checkmark: { color: 'var(--success, #10b981)', fontSize: '14px', fontWeight: 'bold' }
    },
    textDirection: { ltr: { direction: 'ltr', textAlign: 'left' }, rtl: { direction: 'rtl', textAlign: 'right' } },
    responsive: { mobile: { langSwitch: { top: '10px', right: '10px', minWidth: '100px', fontSize: '12px', padding: '6px 10px' }, languageSelector: { minWidth: '160px', right: '0', left: 'auto' } }, tablet: { langSwitch: { top: '15px', right: '15px', minWidth: '110px' } } },
    animations: { fadeIn: { animation: 'fadeIn 0.2s ease-out' }, slideDown: { animation: 'slideDown 0.2s ease-out' } },
    themes: { light: { langSwitch: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#1e293b' } }, dark: { langSwitch: { backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }, languageSelector: { backgroundColor: '#0f172a', borderColor: '#475569' } } },
    accessibility: { focus: { outline: '2px solid var(--primary, #3b82f6)', outlineOffset: '2px' }, highContrast: { langSwitch: { borderWidth: '2px' } } }
  };

  window.I18N_ANIMATIONS = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(180deg); }
  }
  `;

  window.I18N_UTILS = {
    getCurrentTheme: () => document.documentElement.getAttribute('data-theme') || 'light',
    getDeviceType: () => {
      const width = window.innerWidth;
      if (width < 640) return 'mobile';
      if (width < 1024) return 'tablet';
      return 'desktop';
    },
    mergeStyles: (...styles) => Object.assign({}, ...styles),
    applyResponsiveStyles: (baseStyles, responsiveStyles) => {
      const device = window.I18N_UTILS.getDeviceType();
      return { ...baseStyles, ...(responsiveStyles?.[device] || {}) };
    }
  };
})();