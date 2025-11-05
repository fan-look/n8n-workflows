// Scan n8n workflow JSON files for Chinese localization status
// Windows-friendly Node.js script

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WORKFLOWS_DIR = path.join(ROOT, 'workflows');
const REPORT_DIR = path.join(ROOT, 'reports');
const REPORT_JSON = path.join(REPORT_DIR, 'workflow_i18n_report.json');
const REPORT_MD = path.join(REPORT_DIR, 'workflow_i18n_report.md');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function isJsonFile(filePath) {
  return filePath.toLowerCase().endsWith('.json');
}

function containsChinese(text) {
  if (!text || typeof text !== 'string') return false;
  return /[\u4e00-\u9fff]/.test(text);
}

function getDescription(obj) {
  // Try common places for description-like content
  const candidates = [
    obj.description,
    obj.notes,
    obj.meta?.description,
    obj.meta?.notes,
  ];

  // Search nodes for notes/description
  if (Array.isArray(obj.nodes)) {
    for (const node of obj.nodes) {
      if (node?.notes) {
        candidates.push(node.notes);
      }
      const p = node?.parameters;
      if (p && typeof p === 'object') {
        if (typeof p.description === 'string') candidates.push(p.description);
        if (typeof p.text === 'string') candidates.push(p.text);
        if (typeof p.message === 'string') candidates.push(p.message);
      }
    }
  }

  // First non-empty string
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim().length > 0) return c.trim();
  }
  return '';
}

function readJsonSafe(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return { __read_error: String(err && err.message || err) };
  }
}

function scanDir(dir, results) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(full, results);
    } else if (entry.isFile() && isJsonFile(full)) {
      const json = readJsonSafe(full);
      if (json.__read_error) {
        results.errors.push({ file: full, error: json.__read_error });
        continue;
      }
      const name = typeof json.name === 'string' ? json.name.trim() : '';
      const description = getDescription(json);
      const nameZh = containsChinese(name);
      const descZh = containsChinese(description);
      const localized = nameZh || descZh;

      const item = {
        file: full,
        name,
        description,
        nameHasChinese: nameZh,
        descriptionHasChinese: descZh,
        localized,
      };
      results.items.push(item);
    }
  }
}

function generateReport(results) {
  const total = results.items.length;
  const localized = results.items.filter(i => i.localized).length;
  const needLocalization = results.items.filter(i => !i.localized);

  const summary = {
    scannedAt: new Date().toISOString(),
    workflowsDir: WORKFLOWS_DIR,
    totalWorkflows: total,
    localizedCount: localized,
    needLocalizationCount: needLocalization.length,
    needLocalizationList: needLocalization.map(i => ({
      file: i.file,
      name: i.name,
      description: i.description,
    })),
    errors: results.errors,
  };

  ensureDir(REPORT_DIR);
  fs.writeFileSync(REPORT_JSON, JSON.stringify(summary, null, 2), 'utf8');

  const mdLines = [];
  mdLines.push(`# 工作流汉化扫描报告`);
  mdLines.push(`- 扫描时间: ${summary.scannedAt}`);
  mdLines.push(`- 工作流目录: \`${summary.workflowsDir}\``);
  mdLines.push(`- 总工作流数量: ${summary.totalWorkflows}`);
  mdLines.push(`- 已汉化数量: ${summary.localizedCount}`);
  mdLines.push(`- 需要汉化数量: ${summary.needLocalizationCount}`);
  mdLines.push('');
  mdLines.push(`## 需要汉化的工作流列表 (${summary.needLocalizationCount})`);
  if (summary.needLocalizationList.length === 0) {
    mdLines.push('- 无');
  } else {
    for (const item of summary.needLocalizationList) {
      mdLines.push(`- 文件: \`${item.file}\``);
      mdLines.push(`  - 名称: ${item.name || '(空)'}`);
      mdLines.push(`  - 描述: ${item.description ? item.description.replace(/\s+/g, ' ').slice(0, 300) : '(空)'}\n`);
    }
  }
  if (summary.errors && summary.errors.length) {
    mdLines.push('');
    mdLines.push(`## 读取错误 (${summary.errors.length})`);
    for (const e of summary.errors) {
      mdLines.push(`- \`${e.file}\`: ${e.error}`);
    }
  }
  fs.writeFileSync(REPORT_MD, mdLines.join('\n'), 'utf8');

  console.log('Scan complete.');
  console.log(`Total: ${summary.totalWorkflows}, Localized: ${summary.localizedCount}, Need: ${summary.needLocalizationCount}`);
  console.log(`Report JSON: ${REPORT_JSON}`);
  console.log(`Report MD:   ${REPORT_MD}`);
}

function main() {
  if (!fs.existsSync(WORKFLOWS_DIR)) {
    console.error(`Workflows directory not found: ${WORKFLOWS_DIR}`);
    process.exit(1);
  }
  const results = { items: [], errors: [] };
  scanDir(WORKFLOWS_DIR, results);
  generateReport(results);
}

main();