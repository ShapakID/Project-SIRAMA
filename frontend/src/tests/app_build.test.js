import { execSync } from 'child_process';
import assert from 'assert';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const cwd = path.resolve(__dirname, '../..');
  const output = execSync('npm run build', { cwd }).toString();
  assert(output.includes('built in') || output.includes('dist'), 'Frontend must build successfully');
  console.log('Task 7 Frontend build test passed.');
} catch (err) {
  console.error('Frontend build failed:', err.message);
  process.exit(1);
}
