/**
 * 多语言后端API（本地文件存储版）
 * 使用项目本地 JSON 文件提供语言配置和翻译数据
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const storage = require('./i18n-storage');

const router = express.Router();

// 中间件
router.use(cors());
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// 限流配置（应用到本路由）
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
router.use(limiter);

// 健康检查端点
router.get('/health', async (req, res) => {
  try {
    await storage.ensureDataDirs();
    res.json({
      status: 'healthy',
      storage: 'available',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 获取用户语言偏好
router.get('/user-language/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const language = await storage.getUserLanguagePreference(userId);
    const isDefault = language === 'en';
    res.json({ userId, language, isDefault });
  } catch (error) {
    console.error('Error getting user language preference:', error);
    res.status(500).json({
      error: 'Failed to get user language preference',
      message: error.message
    });
  }
});

// 保存用户语言偏好
router.post('/user-language', async (req, res) => {
  try {
    const { userId, language } = req.body;
    if (!userId || !language) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'userId and language are required'
      });
    }
    await storage.setUserLanguagePreference(userId, language);
    res.json({
      success: true,
      userId,
      language
    });
  } catch (error) {
    console.error('Error saving user language preference:', error);
    res.status(500).json({
      error: 'Failed to save user language preference',
      message: error.message
    });
  }
});

// 获取指定语言命名空间的翻译
router.get('/translations/:language/:namespace', async (req, res) => {
  try {
    const { language, namespace } = req.params;
    const translations = await storage.getTranslations(language, namespace);
    res.json({
      language,
      namespace,
      translations,
      count: Object.keys(translations).length
    });
  } catch (error) {
    console.error('Error getting translations:', error);
    res.status(500).json({
      error: 'Failed to get translations',
      message: error.message
    });
  }
});

// 批量获取翻译
router.post('/translations/batch', async (req, res) => {
  try {
    const { language, namespaces } = req.body;
    if (!language || !Array.isArray(namespaces)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'language and namespaces array are required'
      });
    }
    const translations = await storage.getTranslationsBatch(language, namespaces);
    res.json({
      language,
      translations,
      namespaces: namespaces.length
    });
  } catch (error) {
    console.error('Error getting translations batch:', error);
    res.status(500).json({
      error: 'Failed to get translations batch',
      message: error.message
    });
  }
});

// 获取支持的语言列表（从本地目录扫描）
router.get('/languages', async (req, res) => {
  try {
    const languages = await storage.getSupportedLanguages();
    res.json({
      languages,
      count: languages.length
    });
  } catch (error) {
    console.error('Error getting supported languages:', error);
    res.status(500).json({
      error: 'Failed to get supported languages',
      message: error.message
    });
  }
});

module.exports = router;