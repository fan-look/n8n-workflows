/**
 * 多语言后端集成模块
 * 提供与后端API的交互功能，用于获取和保存语言配置
 */

class I18nBackend {
  constructor() {
    this.baseUrl = '/api/i18n';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
  }

  /**
   * 获取用户的语言偏好设置
   * @param {string} userId - 用户ID
   * @returns {Promise<string>} 语言代码
   */
  async getUserLanguagePreference(userId) {
    try {
      const cacheKey = `user_lang_${userId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.value;
      }

      const response = await fetch(`${this.baseUrl}/user-language/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const language = data.language || 'en';
      
      // 缓存结果
      this.cache.set(cacheKey, {
        value: language,
        timestamp: Date.now()
      });
      
      return language;
    } catch (error) {
      console.error('Failed to get user language preference:', error);
      return 'en'; // 默认返回英文
    }
  }

  /**
   * 保存用户的语言偏好设置
   * @param {string} userId - 用户ID
   * @param {string} language - 语言代码
   * @returns {Promise<boolean>} 是否成功
   */
  async saveUserLanguagePreference(userId, language) {
    try {
      const response = await fetch(`${this.baseUrl}/user-language`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          userId,
          language
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 更新缓存
      const cacheKey = `user_lang_${userId}`;
      this.cache.set(cacheKey, {
        value: language,
        timestamp: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Failed to save user language preference:', error);
      return false;
    }
  }

  /**
   * 获取翻译数据
   * @param {string} language - 语言代码
   * @param {string} namespace - 命名空间
   * @returns {Promise<Object>} 翻译数据
   */
  async getTranslations(language, namespace = 'common') {
    try {
      const cacheKey = `translations_${language}_${namespace}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.value;
      }

      const response = await fetch(`${this.baseUrl}/translations/${language}/${namespace}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // 缓存结果
      this.cache.set(cacheKey, {
        value: data.translations,
        timestamp: Date.now()
      });
      
      return data.translations;
    } catch (error) {
      console.error('Failed to get translations:', error);
      return {}; // 返回空对象作为后备
    }
  }

  /**
   * 批量获取翻译数据
   * @param {string} language - 语言代码
   * @param {Array<string>} namespaces - 命名空间数组
   * @returns {Promise<Object>} 翻译数据对象
   */
  async getTranslationsBatch(language, namespaces) {
    try {
      const response = await fetch(`${this.baseUrl}/translations/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          language,
          namespaces
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.translations;
    } catch (error) {
      console.error('Failed to get translations batch:', error);
      return {};
    }
  }

  /**
   * 获取支持的语言列表
   * @returns {Promise<Array>} 语言列表
   */
  async getSupportedLanguages() {
    try {
      const cacheKey = 'supported_languages';
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.value;
      }

      const response = await fetch(`${this.baseUrl}/languages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // 缓存结果
      this.cache.set(cacheKey, {
        value: data.languages,
        timestamp: Date.now()
      });
      
      return data.languages;
    } catch (error) {
      console.error('Failed to get supported languages:', error);
      return [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'zh', name: 'Chinese', nativeName: '中文' }
      ]; // 返回默认语言列表
    }
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 获取当前用户信息（简化版本）
   * @returns {Object} 用户信息
   */
  getCurrentUser() {
    // 这里可以实现更复杂的用户识别逻辑
    // 例如从cookie、localStorage或JWT token中获取
    const userId = localStorage.getItem('userId') || 'anonymous';
    return { id: userId };
  }

  /**
   * 检查后端连接状态
   * @returns {Promise<boolean>} 是否连接成功
   */
  async checkConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
      });

      return response.ok;
    } catch (error) {
      console.error('Backend connection check failed:', error);
      return false;
    }
  }
}

// 创建全局实例
window.i18nBackend = new I18nBackend();

// 向后兼容的API
window.i18n = window.i18n || {};
window.i18n.saveUserLanguagePreference = async function(language) {
  const user = window.i18nBackend.getCurrentUser();
  return await window.i18nBackend.saveUserLanguagePreference(user.id, language);
};

window.i18n.getUserLanguagePreference = async function() {
  const user = window.i18nBackend.getCurrentUser();
  return await window.i18nBackend.getUserLanguagePreference(user.id);
};