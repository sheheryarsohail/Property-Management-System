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
    
    // Check if it has an <input type="date" ... />
    // We must match '<input' followed by arbitrary whitespace/attributes, then 'type="date"'
    // A robust way is to just replace '<input' with '<DatePicker' IF there's a 'type="date"' inside it.
    // Let's use a regex to find the whole input tag.
    
    const inputRegex = /<input([^>]*?)type="date"([^>]*?)>/g;
    
    if (inputRegex.test(content)) {
      console.log('Modifying:', filePath);
      
      // Replace <input ... type="date" ...> with <DatePicker ... type="date" ...>
      let newContent = content.replace(inputRegex, '<DatePicker$1type="date"$2>');
      
      // Also catch cases where type="date" is before other props
      // Wait, the regex catches it anywhere inside the <input ... > block!
      // But what about self-closing? `<input />` vs `<input></input>`
      // In JSX it's mostly self closing `<input ... />`. The regex /<input([^>]*?)>/g matches the whole opening tag.
      // Wait, what if there are newlines? `[^>]*?` matches newlines in JS if we don't use `.` or if we use `[\s\S]`.
      
      const robustRegex = /<input([\s\S]*?)type="date"([\s\S]*?)>/g;
      newContent = content.replace(robustRegex, '<DatePicker$1type="date"$2>');
      
      // Now add the import at the top
      // Find the last import statement
      const importRegex = /^import.*from.*$/gm;
      let lastImportIndex = 0;
      let match;
      while ((match = importRegex.exec(newContent)) !== null) {
        lastImportIndex = match.index + match[0].length;
      }
      
      const importStatement = "\nimport { DatePicker } from '@/components/DatePicker'";
      
      if (lastImportIndex > 0) {
        newContent = newContent.slice(0, lastImportIndex) + importStatement + newContent.slice(lastImportIndex);
      } else {
        // If no imports (rare), add after 'use client' or at top
        newContent = importStatement + '\n' + newContent;
      }
      
      fs.writeFileSync(filePath, newContent, 'utf8');
    }
  }
});
console.log('Refactoring complete!');
