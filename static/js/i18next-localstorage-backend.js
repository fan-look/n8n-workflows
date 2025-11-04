/**
 * i18next localStorage 后端插件
 * 提供本地存储支持，用于缓存翻译数据
 */

(function() {
  'use strict';

  // 检查是否已定义 i18next
  if (typeof window === 'undefined' || !window.i18next) {
    console.warn('i18next is required for this plugin');
    return;
  }

  // localStorage 后端构造函数
  function LocalStorageBackend(services, options = {}) {
    this.services = services;
    this.options = {
      enabled: true,
      prefix: 'i18next_res_',
      expirationTime: 7 * 24 * 60 * 60 * 1000, // 7天
      defaultVersion: '1.0.0',
      versions: {},
      ...options
    };
    
    this.type = 'backend';
  }

  // 读取翻译数据
  LocalStorageBackend.prototype.read = function(language, namespace, callback) {
    if (!this.options.enabled) {
      return callback && callback(null, {});
    }

    try {
      const key = this.options.prefix + language + '_' + namespace;
      const data = localStorage.getItem(key);
      
      if (!data) {
        return callback && callback(null, {});
      }

      const parsed = JSON.parse(data);
      
      // 检查版本
      const version = this.options.versions[language] || this.options.defaultVersion;
      if (parsed.version !== version) {
        localStorage.removeItem(key);
        return callback && callback(null, {});
      }
      
      // 检查过期时间
      if (this.options.expirationTime && parsed.timestamp) {
        const now = new Date().getTime();
        if (now - parsed.timestamp > this.options.expirationTime) {
          localStorage.removeItem(key);
          return callback && callback(null, {});
        }
      }
      
      callback && callback(null, parsed.data || {});
    } catch (error) {
      console.error('LocalStorageBackend read error:', error);
      callback && callback(error, {});
    }
  };

  // 保存翻译数据
  LocalStorageBackend.prototype.create = function(languages, namespace, key, fallbackValue, callback) {
    if (!this.options.enabled) {
      return callback && callback();
    }

    try {
      // 这里可以实现保存缺失翻译的逻辑
      console.log('Missing translation:', { languages, namespace, key, fallbackValue });
      callback && callback();
    } catch (error) {
      console.error('LocalStorageBackend create error:', error);
      callback && callback(error);
    }
  };

  // 保存翻译数据（批量）
  LocalStorageBackend.prototype.save = function(language, namespace, data, callback) {
    if (!this.options.enabled) {
      return callback && callback();
    }

    try {
      const key = this.options.prefix + language + '_' + namespace;
      const version = this.options.versions[language] || this.options.defaultVersion;
      
      const storageData = {
        version: version,
        timestamp: new Date().getTime(),
        data: data
      };
      
      localStorage.setItem(key, JSON.stringify(storageData));
      callback && callback();
    } catch (error) {
      console.error('LocalStorageBackend save error:', error);
      callback && callback(error);
    }
  };

  // 清理过期的翻译数据
  LocalStorageBackend.prototype.cleanup = function() {
    if (!this.options.enabled || !this.options.expirationTime) {
      return;
    }

    try {
      const now = new Date().getTime();
      const prefix = this.options.prefix;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith(prefix)) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              
              if (parsed.timestamp && now - parsed.timestamp > this.options.expirationTime) {
                localStorage.removeItem(key);
                console.log('Removed expired translation data:', key);
              }
            }
          } catch (error) {
            console.error('Error cleaning up translation data:', key, error);
          }
        }
      }
    } catch (error) {
      console.error('LocalStorageBackend cleanup error:', error);
    }
  };

  // 获取所有存储的键
  LocalStorageBackend.prototype.getStoredKeys = function() {
    const keys = [];
    const prefix = this.options.prefix;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    
    return keys;
  };

  // 清空所有翻译数据
  LocalStorageBackend.prototype.clear = function() {
    try {
      const keys = this.getStoredKeys();
      keys.forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('Cleared all translation data from localStorage');
    } catch (error) {
      console.error('LocalStorageBackend clear error:', error);
    }
  };

  // 获取存储统计信息
  LocalStorageBackend.prototype.getStats = function() {
    try {
      const keys = this.getStoredKeys();
      const stats = {
        totalKeys: keys.length,
        totalSize: 0,
        languages: {},
        oldestEntry: null,
        newestEntry: null
      };
      
      let oldestTimestamp = Infinity;
      let newestTimestamp = 0;
      
      keys.forEach(key => {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const size = new Blob([data]).size;
            stats.totalSize += size;
            
            const parsed = JSON.parse(data);
            if (parsed.timestamp) {
              if (parsed.timestamp < oldestTimestamp) {
                oldestTimestamp = parsed.timestamp;
                stats.oldestEntry = new Date(parsed.timestamp);
              }
              if (parsed.timestamp > newestTimestamp) {
                newestTimestamp = parsed.timestamp;
                stats.newestEntry = new Date(parsed.timestamp);
              }
            }
            
            // 提取语言信息
            const keyParts = key.replace(this.options.prefix, '').split('_');
            if (keyParts.length >= 2) {
              const language = keyParts[0];
              const namespace = keyParts.slice(1).join('_');
              
              if (!stats.languages[language]) {
                stats.languages[language] = {
                  namespaces: [],
                  totalSize: 0
                };
              }
              
              stats.languages[language].namespaces.push(namespace);
              stats.languages[language].totalSize += size;
            }
          }
        } catch (error) {
          console.error('Error getting stats for key:', key, error);
        }
      });
      
      return stats;
    } catch (error) {
      console.error('LocalStorageBackend getStats error:', error);
      return null;
    }
  };

  // 插件初始化函数
  function initI18nextLocalStorageBackend() {
    if (window.i18next && window.i18next.Backend) {
      window.i18nextLocalStorageBackend = LocalStorageBackend;
      window.I18nextLocalStorageBackend = LocalStorageBackend;
      
      // 向后兼容
      if (typeof module !== 'undefined' && module.exports) {
        module.exports = LocalStorageBackend;
      }
      
      console.log('i18next localStorage backend plugin initialized');
    } else {
      console.warn('i18next is not available');
    }
  }

  // 初始化插件
  initI18nextLocalStorageBackend();
})();