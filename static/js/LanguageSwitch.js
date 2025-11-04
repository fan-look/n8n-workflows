/**
 * 多语言切换组件
 * 基于原生JavaScript实现，不依赖React
 */

class LanguageSwitch {
  constructor(containerId = 'lang-switch-container', options = {}) {
    this.options = {
      containerId: containerId,
      defaultLanguage: 'en',
      supportedLanguages: [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        // 与 i18n-config 保持一致，使用 zh 而不是 zh-CN
        { code: 'zh', name: '简体中文', flag: '🇨🇳' }
      ],
      onLanguageChange: null,
      saveToBackend: true,
      ...options
    };
    
    this.currentLanguage = this.getStoredLanguage() || this.options.defaultLanguage;
    this.isOpen = false;
    this.container = null;
    this.button = null;
    this.dropdown = null;
    
    this.init();
  }

  // 初始化组件（立即渲染按钮，不再阻塞于 i18next）
  init() {
    // 始终先创建 UI
    this.createContainer();
    this.createButton();
    this.createDropdown();
    this.bindEvents();

    // 如果 i18next 就绪，则进行页面翻译更新；否则先显示默认语言按钮
    if (typeof window.i18next !== 'undefined') {
      this.setLanguage(this.currentLanguage, false);
    } else {
      const lang = this.getLanguageByCode(this.currentLanguage) || this.getLanguageByCode(this.options.defaultLanguage);
      if (lang) this.updateButtonContent(lang);
      // 等待 i18next 初始化事件，再完成语言切换与页面更新
      document.addEventListener('i18next:initialized', () => {
        this.setLanguage(this.currentLanguage, false);
      });
    }
  }

  // 渲染方法供外部调用
  render() {
    this.init();
  }

  // 创建容器
  createContainer() {
    this.container = document.createElement('div');
    this.container.id = this.options.containerId;
    this.container.className = 'lang-switch-container';
    this.container.setAttribute('role', 'navigation');
    this.container.setAttribute('aria-label', 'Language switcher');
    
    // 查找目标容器，如果不存在则添加到body
    const targetContainer = document.getElementById(this.options.containerId.replace('-container', '')) || document.getElementById(this.options.containerId);
    if (targetContainer) {
      targetContainer.appendChild(this.container);
    } else {
      document.body.appendChild(this.container);
    }
  }

  // 创建按钮
  createButton() {
    this.button = document.createElement('button');
    this.button.className = 'language-switch-button';
    this.button.setAttribute('type', 'button');
    this.button.setAttribute('aria-expanded', 'false');
    this.button.setAttribute('aria-haspopup', 'true');

    const lang = this.getLanguageByCode(this.currentLanguage) || this.getLanguageByCode(this.options.defaultLanguage);
    if (lang) this.updateButtonContent(lang);

    this.container.appendChild(this.button);
  }

  // 创建下拉菜单
  createDropdown() {
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'language-selector';
    this.dropdown.style.display = 'none';

    this.options.supportedLanguages.forEach(lang => {
      const option = this.createLanguageOption(lang);
      this.dropdown.appendChild(option);
    });

    this.container.appendChild(this.dropdown);
  }

  // 创建语言选项
  createLanguageOption(lang) {
    const option = document.createElement('button');
    option.className = 'language-option';
    option.type = 'button';
    option.setAttribute('role', 'option');
    option.setAttribute('data-language', lang.code);

    const flag = document.createElement('span');
    flag.className = 'language-flag';
    flag.textContent = lang.flag;

    const text = document.createElement('span');
    text.textContent = lang.name;

    const check = document.createElement('span');
    check.className = 'language-checkmark';
    check.textContent = '✓';
    check.style.display = 'none';

    option.appendChild(flag);
    option.appendChild(text);
    option.appendChild(check);

    option.addEventListener('click', () => {
      this.setLanguage(lang.code);
    });

    return option;
  }

  // 更新按钮内容
  updateButtonContent(lang) {
    this.button.innerHTML = '';
    
    const flag = document.createElement('span');
    flag.className = 'language-flag';
    flag.textContent = lang.flag;
    
    const text = document.createElement('span');
    text.textContent = lang.name;
    
    const arrow = document.createElement('span');
    arrow.className = 'dropdown-arrow';
    arrow.textContent = '▼';
    
    this.button.appendChild(flag);
    this.button.appendChild(text);
    this.button.appendChild(arrow);
    
    this.button.setAttribute('aria-label', `Current language: ${lang.name}. Click to change.`);
  }

  // 绑定交互事件
  bindEvents() {
    // 打开/关闭下拉
    this.button?.addEventListener('click', () => {
      this.toggleDropdown();
    });

    // 键盘支持
    this.container.addEventListener('keydown', (e) => {
      const currentOption = document.activeElement;
      switch (e.key) {
        case 'Escape':
          this.closeDropdown();
          break;
        case 'Enter':
          if (currentOption?.classList.contains('language-option')) {
            currentOption.click();
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.focusNextOption(currentOption);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.focusPreviousOption(currentOption);
          break;
        case 'Home':
          e.preventDefault();
          this.focusFirstOption();
          break;
        case 'End':
          e.preventDefault();
          this.focusLastOption();
          break;
      }
    });

    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.closeDropdown();
      }
    });

    // 窗口大小改变时重新定位
    window.addEventListener('resize', () => {
      if (this.isOpen) {
        this.positionDropdown();
      }
    });

    // 页面滚动时关闭下拉
    window.addEventListener('scroll', () => {
      this.closeDropdown();
    });

    // 语言切换事件监听
    document.addEventListener('languageChanged', (e) => {
      this.currentLanguage = e.detail?.newLanguage || this.currentLanguage;
      this.updateButtonContent(this.getCurrentLanguage());
    });

    // 浏览器语言变化
    window.addEventListener('languagechange', () => {
      const browserLang = navigator.language?.toLowerCase().split('-')[0];
      if (this.isLanguageSupported(browserLang)) {
        this.setLanguage(browserLang, false);
      }
    });
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    this.dropdown.style.display = this.isOpen ? 'block' : 'none';
    this.button.setAttribute('aria-expanded', this.isOpen ? 'true' : 'false');
    if (this.isOpen) this.positionDropdown();
  }

  openDropdown() {
    this.isOpen = true;
    this.dropdown.style.display = 'block';
    this.button.setAttribute('aria-expanded', 'true');
    this.positionDropdown();
  }

  closeDropdown() {
    this.isOpen = false;
    this.dropdown.style.display = 'none';
    this.button.setAttribute('aria-expanded', 'false');
  }

  updateSelectedOption() {
    const options = this.dropdown.querySelectorAll('.language-option');
    options.forEach(opt => {
      const isActive = opt.getAttribute('data-language') === this.currentLanguage;
      opt.classList.toggle('active', isActive);
      const check = opt.querySelector('.language-checkmark');
      if (check) check.style.display = isActive ? 'inline' : 'none';
    });
  }

  // 设置语言
  async setLanguage(langCode, saveToStorage = true) {
    if (!this.isLanguageSupported(langCode)) {
      console.warn(`Language ${langCode} is not supported`);
      return;
    }

    const previousLang = this.currentLanguage;
    this.currentLanguage = langCode;
    
    // 更新UI
    const lang = this.getLanguageByCode(langCode);
    this.updateButtonContent(lang);
    this.updateSelectedOption();
    this.closeDropdown();
    
    // 保存到本地存储
    if (saveToStorage) {
      this.storeLanguage(langCode);
    }
    
    // 触发i18next语言切换
    if (window.i18n && window.i18n.changeLanguage) {
      try {
        await window.i18n.changeLanguage(langCode);
        // 更新页面上的所有data-i18n元素
        this.updatePageTranslations();
      } catch (i18nError) {
        console.error('i18next.changeLanguage error:', i18nError);
        this.showError('Failed to change language with i18next');
        return;
      }
    } else if (typeof window.i18next !== 'undefined') {
      try {
        await window.i18next.changeLanguage(langCode);
        this.updatePageTranslations();
      } catch (err) {
        console.warn('Direct i18next changeLanguage failed:', err);
      }
    } else {
      // i18n 未就绪，则等事件再更新
      document.addEventListener('i18next:initialized', async () => {
        if (typeof window.i18next !== 'undefined') {
          await window.i18next.changeLanguage(langCode);
          this.updatePageTranslations();
        }
      }, { once: true });
    }
    
    // 保存到后端
    if (this.options.saveToBackend && window.i18n && window.i18n.saveUserLanguagePreference) {
      window.i18n.saveUserLanguagePreference(langCode);
    }
    
    // 触发语言变化事件
    this.dispatchLanguageChangeEvent(langCode, previousLang);
    
    // 执行回调函数
    if (this.options.onLanguageChange) {
      this.options.onLanguageChange(langCode, lang);
    }
  }

  updatePageTranslations() {
    try {
      const elements = document.querySelectorAll('[data-i18n]');
      elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (!key) return;
        const text = (window.i18n?.t || window.i18next?.t)?.(key) || el.textContent;
        if (text) el.textContent = text;
      });
    } catch (error) {
      console.warn('Failed to update page translations:', error);
    }
  }

  getCurrentLanguage() {
    return this.getLanguageByCode(this.currentLanguage);
  }

  getLanguageByCode(code) {
    return this.options.supportedLanguages.find(l => l.code === code);
  }

  isLanguageSupported(code) {
    return this.options.supportedLanguages.some(l => l.code === code);
  }

  // 本地存储相关
  storeLanguage(langCode) {
    try {
      localStorage.setItem('preferredLanguage', langCode);
    } catch (error) {
      console.warn('Failed to store language preference:', error);
    }
  }

  getStoredLanguage() {
    try {
      return localStorage.getItem('preferredLanguage');
    } catch (error) {
      console.warn('Failed to retrieve stored language preference:', error);
      return null;
    }
  }

  // 触发语言变化事件
  dispatchLanguageChangeEvent(newLang, previousLang) {
    try {
      const event = new CustomEvent('languageChanged', {
        detail: { newLanguage: newLang, previousLanguage: previousLang }
      });
      document.dispatchEvent(event);
    } catch (error) {
      console.warn('Failed to dispatch languageChanged event:', error);
    }
  }

  focusFirstOption() {
    const first = this.dropdown.querySelector('.language-option');
    first?.focus();
  }

  focusNextOption(currentOption) {
    const options = Array.from(this.dropdown.querySelectorAll('.language-option'));
    const index = options.indexOf(currentOption);
    const next = options[index + 1] || options[0];
    next?.focus();
  }

  focusPreviousOption(currentOption) {
    const options = Array.from(this.dropdown.querySelectorAll('.language-option'));
    const index = options.indexOf(currentOption);
    const prev = options[index - 1] || options[options.length - 1];
    prev?.focus();
  }

  focusLastOption() {
    const options = Array.from(this.dropdown.querySelectorAll('.language-option'));
    const last = options[options.length - 1];
    last?.focus();
  }

  positionDropdown() {
    const rect = this.button.getBoundingClientRect();
    this.dropdown.style.minWidth = `${rect.width}px`;
  }

  destroy() {
    try {
      this.container?.remove();
    } catch (_) {}
  }

  getCurrentLanguageCode() {
    return this.currentLanguage;
  }

  getSupportedLanguages() {
    return this.options.supportedLanguages.slice();
  }

  static create(options) {
    return new LanguageSwitch(options?.containerId || 'lang-switch-container', options);
  }
}

let globalLanguageSwitch = null;

function initLanguageSwitch(options = {}) {
  if (!globalLanguageSwitch) {
    globalLanguageSwitch = LanguageSwitch.create(options);
  }
  return globalLanguageSwitch;
}

function getLanguageSwitch() {
  return globalLanguageSwitch;
}

function t(key, fallback = '') {
  try {
    return (window.i18n?.t || window.i18next?.t)?.(key) || fallback;
  } catch (_) { return fallback; }
}

if (typeof window !== 'undefined') {
  window.LanguageSwitch = LanguageSwitch;
  window.initLanguageSwitch = initLanguageSwitch;
  window.getLanguageSwitch = getLanguageSwitch;
  window.t = t;
}