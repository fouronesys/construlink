import fs from 'fs';
import path from 'path';

const logoPath = path.join(process.cwd(), 'attached_assets/ConstructLink_20251004_013258_0000_1759556910770.png');
const logoBuffer = fs.readFileSync(logoPath);
const logoBase64 = logoBuffer.toString('base64');

console.log(`data:image/png;base64,${logoBase64}`);
