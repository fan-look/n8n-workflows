const fs = require('fs-extra');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data', 'i18n');
const LOCALES_DIR = path.join(process.cwd(), 'static', 'locales');
const USER_PREFS_FILE = path.join(DATA_DIR, 'user-prefs.json');

async function ensureDataDirs() {
  await fs.ensureDir(DATA_DIR);
  await fs.ensureDir(LOCALES_DIR);
}

async function readJsonSafe(filePath, defaultValue = {}) {
  try {
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    }
  } catch (e) {
    console.warn(`Failed to read JSON: ${filePath}`, e.message);
  }
  return defaultValue;
}

async function writeJsonSafe(filePath, data) {
  try {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, data, { spaces: 2 });
    return true;
  } catch (e) {
    console.error(`Failed to write JSON: ${filePath}`, e.message);
    return false;
  }
}

// 语言代码规范化，确保与本地目录匹配
function normalizeLanguage(language) {
  const code = String(language || '').toLowerCase();
  // 常见映射：i18next 可能返回 zh-CN、en-US 等
  if (code.startsWith('zh')) return 'zh';
  if (code.startsWith('en')) return 'en';
  return language; // 原样返回以允许未来扩展
}

function getLocaleFile(language) {
  const normalized = normalizeLanguage(language);
  return path.join(LOCALES_DIR, normalized, 'translation.json');
}

async function getSupportedLanguages() {
  await ensureDataDirs();
  const langs = [];
  if (!(await fs.pathExists(LOCALES_DIR))) return langs;
  const entries = await fs.readdir(LOCALES_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const code = entry.name;
      // 简单填充名称，前端可自行映射更友好名称
      langs.push({ code, name: code, native_name: code, is_active: true, sort_order: 0 });
    }
  }
  // 保证至少提供英文作为后备
  if (!langs.find(l => l.code === 'en')) {
    langs.push({ code: 'en', name: 'English', native_name: 'English', is_active: true, sort_order: 0 });
  }
  return langs;
}

async function getTranslations(language, namespace) {
  await ensureDataDirs();
  const file = getLocaleFile(language);
  const json = await readJsonSafe(file, {});
  const nsObj = json[namespace] || {};
  return nsObj;
}

async function getTranslationsBatch(language, namespaces) {
  await ensureDataDirs();
  const file = getLocaleFile(language);
  const json = await readJsonSafe(file, {});
  const result = {};
  for (const ns of namespaces) {
    result[ns] = json[ns] || {};
  }
  return result;
}

async function getUserLanguagePreference(userId) {
  await ensureDataDirs();
  const prefs = await readJsonSafe(USER_PREFS_FILE, {});
  return prefs[userId] || 'en';
}

async function setUserLanguagePreference(userId, language) {
  await ensureDataDirs();
  const prefs = await readJsonSafe(USER_PREFS_FILE, {});
  prefs[userId] = language;
  await writeJsonSafe(USER_PREFS_FILE, prefs);
  return true;
}

module.exports = {
  getSupportedLanguages,
  getTranslations,
  getTranslationsBatch,
  getUserLanguagePreference,
  setUserLanguagePreference,
  ensureDataDirs
};