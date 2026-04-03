import fs from 'fs';

const files = ['src/cli/handlers/mcp.tsx'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  // First clean up any existing mismatched ignore comments
  content = content.replace(/^\s*\/\/\s*biome-ignore\s*lint\/suspicious\/noConsole.*\n/gm, '');
  
  // Then inject proper ignore comments above console.log and console.error
  content = content.replace(/^([ \t]*)console\.(log|error|warn|info)\(/gm, '$1// biome-ignore lint/suspicious/noConsole: intentional console output\n$1console.$2(');
  
  fs.writeFileSync(file, content);
  console.log(`Fixed ${file}`);
}
