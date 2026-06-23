import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const replacements = [
  // Backgrounds
  { pattern: /(?<!dark:)bg-white/g, replacement: 'bg-white dark:bg-slate-800' },
  { pattern: /(?<!dark:)bg-slate-50/g, replacement: 'bg-slate-50 dark:bg-slate-900' },
  { pattern: /(?<!dark:)bg-slate-100/g, replacement: 'bg-slate-100 dark:bg-slate-800/80' },
  { pattern: /(?<!dark:)bg-gray-50/g, replacement: 'bg-gray-50 dark:bg-slate-900' },
  { pattern: /(?<!dark:)bg-gray-100/g, replacement: 'bg-gray-100 dark:bg-slate-800/80' },
  { pattern: /(?<!dark:)bg-slate-200/g, replacement: 'bg-slate-200 dark:bg-slate-700' },

  // Text colors
  { pattern: /(?<!dark:)text-slate-900/g, replacement: 'text-slate-900 dark:text-white' },
  { pattern: /(?<!dark:)text-slate-800/g, replacement: 'text-slate-800 dark:text-slate-100' },
  { pattern: /(?<!dark:)text-slate-700/g, replacement: 'text-slate-700 dark:text-slate-200' },
  { pattern: /(?<!dark:)text-slate-600/g, replacement: 'text-slate-600 dark:text-slate-300' },
  { pattern: /(?<!dark:)text-slate-500/g, replacement: 'text-slate-500 dark:text-slate-400' },
  
  { pattern: /(?<!dark:)text-gray-900/g, replacement: 'text-gray-900 dark:text-white' },
  { pattern: /(?<!dark:)text-gray-800/g, replacement: 'text-gray-800 dark:text-slate-100' },
  { pattern: /(?<!dark:)text-gray-700/g, replacement: 'text-gray-700 dark:text-slate-200' },
  { pattern: /(?<!dark:)text-gray-600/g, replacement: 'text-gray-600 dark:text-slate-300' },
  { pattern: /(?<!dark:)text-gray-500/g, replacement: 'text-gray-500 dark:text-slate-400' },

  // Border colors
  { pattern: /(?<!dark:)border-slate-100/g, replacement: 'border-slate-100 dark:border-slate-700' },
  { pattern: /(?<!dark:)border-slate-200/g, replacement: 'border-slate-200 dark:border-slate-700' },
  { pattern: /(?<!dark:)border-slate-300/g, replacement: 'border-slate-300 dark:border-slate-600' },
  { pattern: /(?<!dark:)border-gray-200/g, replacement: 'border-gray-200 dark:border-slate-700' },
  { pattern: /(?<!dark:)border-gray-300/g, replacement: 'border-gray-300 dark:border-slate-600' },

  // Specific components like hover
  { pattern: /(?<!dark:)hover:bg-slate-50/g, replacement: 'hover:bg-slate-50 dark:hover:bg-slate-700/50' },
  { pattern: /(?<!dark:)hover:bg-slate-100/g, replacement: 'hover:bg-slate-100 dark:hover:bg-slate-700' },
  { pattern: /(?<!dark:)hover:text-slate-900/g, replacement: 'hover:text-slate-900 dark:hover:text-white' },
];

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  for (let rule of replacements) {
    content = content.replace(rule.pattern, rule.replacement);
  }

  // Double check so we don't accidentally get `dark:bg-white dark:dark:bg-slate-800`
  content = content.replace(/dark:dark:/g, 'dark:');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

const targetDirs = [
  path.join(process.cwd(), 'src/components'),
];

targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    walkDir(dir, processFile);
  }
});

processFile(path.join(process.cwd(), 'src/App.tsx'));
console.log('Done!');
