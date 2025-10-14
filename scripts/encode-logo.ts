import fs from 'fs';
import path from 'path';

const logoPath = path.join(process.cwd(), 'attached_assets/IMG_20251012_020459_1760249136162.png');
const logoBuffer = fs.readFileSync(logoPath);
const logoBase64 = logoBuffer.toString('base64');

console.log(`data:image/png;base64,${logoBase64}`);
