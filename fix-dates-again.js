const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('apps/web/src/app', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    let modified = false;

    // 1. Revert previous flawed replacements
    if (content.includes('<DatePicker')) {
      content = content.replace(/<DatePicker/g, '<input');
      modified = true;
    }
    const importStatement = "import { DatePicker } from '@/components/DatePicker'";
    if (content.includes(importStatement)) {
      content = content.replace("\n" + importStatement, "");
      content = content.replace(importStatement + "\n", "");
      modified = true;
    }

    // 2. Apply correct replacement using [^>] to ensure it stays within a single tag
    const correctRegex = /<input([^>]*?type="date"[^>]*?)>/g;
    
    if (correctRegex.test(content)) {
      content = content.replace(correctRegex, '<DatePicker$1>');
      
      // Add import
      const importRegex = /^import.*from.*$/gm;
      let lastImportIndex = 0;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        lastImportIndex = match.index + match[0].length;
      }
      
      if (lastImportIndex > 0) {
        content = content.slice(0, lastImportIndex) + "\n" + importStatement + content.slice(lastImportIndex);
      } else {
        content = importStatement + '\n' + content;
      }
      modified = true;
    }
    
    if (modified) {
      console.log('Fixed:', filePath);
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
});
console.log('Done fixing dates!');
