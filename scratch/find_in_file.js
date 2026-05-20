const fs = require('fs');
const filepath = 'frontend/src/pages/ClientePageCompleteFixed.jsx';

const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('normalizeClienteData')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});

