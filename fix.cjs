const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace white text with main text color, except in buttons where we want them white
  // Actually, color: '#fff' is mainly used in inputs, headers, and the prescription PDF
  // We'll replace it and adjust PDF manually later if needed.
  if (!filePath.includes('Prescription.jsx')) {
    content = content.replace(/color:\s*'#fff'/g, "color: 'var(--text-main)'");
  } else {
    // In Prescription, #fff is the background of the A4 paper. We want to keep it.
    // Wait, let's just use CSS vars.
    content = content.replace(/color:\s*'#fff'/g, "color: 'var(--text-main)'");
    content = content.replace(/backgroundColor:\s*'#fff'/g, "backgroundColor: 'var(--bg-card)'");
  }
  
  // Replace dark backgrounds with subtle light backgrounds
  content = content.replace(/background:\s*'rgba\(0,0,0,0\.2\)'/g, "background: 'var(--bg-muted)'");
  content = content.replace(/background:\s*'rgba\(0,0,0,0\.3\)'/g, "background: 'var(--bg-input)'");
  
  // Replace glass white styles with light mode borders/backgrounds
  content = content.replace(/background:\s*'rgba\(255,255,255,0\.05\)'/g, "background: 'var(--bg-card-hover)'");
  content = content.replace(/background:\s*'rgba\(255,255,255,0\.1\)'/g, "background: 'var(--bg-card-alt)'");
  
  fs.writeFileSync(filePath, content, 'utf8');
}

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      replaceInFile(fullPath);
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('JSX inline styles updated.');
