import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal compliant PNG generator in pure Node.js using zlib
function createPng(width, height, drawFn) {
  // RGBA buffer with 1 filter byte per scanline
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression method: 0
  ihdrData[11] = 0; // Filter method: 0
  ihdrData[12] = 0; // Interlace method: 0
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(8 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// Standard CRC32 table
let crcTable = null;
function getCrcTable() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c >>> 0;
  }
  return crcTable;
}

function crc32(buf) {
  const table = getCrcTable();
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Drawing function for Shramik Sakshi Icon (Forest green background + gold & white emblem)
function drawIcon(x, y, w, h, isMaskable = false) {
  const nx = x / w;
  const ny = y / h;
  const cx = 0.5;
  const cy = 0.5;
  const dx = nx - cx;
  const dy = ny - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background
  const bgR = 27;  // #1b
  const bgG = 67;  // #43
  const bgB = 50;  // #32

  // Golden accent
  const goldR = 234; // #ea
  const goldG = 179; // #b3
  const goldB = 8;   // #08

  // Check border radius for standard (non-maskable) icon
  if (!isMaskable) {
    // Rounded square with 20% radius
    const cornerR = 0.2;
    const ax = Math.abs(nx - 0.5);
    const ay = Math.abs(ny - 0.5);
    if (ax > (0.5 - cornerR) && ay > (0.5 - cornerR)) {
      const cdx = ax - (0.5 - cornerR);
      const cdy = ay - (0.5 - cornerR);
      if (Math.sqrt(cdx * cdx + cdy * cdy) > cornerR) {
        return [0, 0, 0, 0]; // Transparent outside corner
      }
    }
  }

  // Gold border ring
  if (!isMaskable && (dist > 0.44 && dist < 0.47)) {
    return [goldR, goldG, goldB, 255];
  }

  // Hard hat shape (Upper dome)
  if (ny >= 0.28 && ny <= 0.48) {
    const domeW = 0.28 * Math.sqrt(1 - Math.pow((ny - 0.48) / 0.20, 2));
    if (Math.abs(nx - 0.5) <= domeW) {
      return [goldR, goldG, goldB, 255];
    }
  }

  // Hard hat brim
  if (ny >= 0.47 && ny <= 0.52 && Math.abs(nx - 0.5) <= 0.32) {
    return [goldR, goldG, goldB, 255];
  }

  // Passbook / Ledger card (White rectangle)
  if (ny >= 0.55 && ny <= 0.78 && Math.abs(nx - 0.5) <= 0.22) {
    // Rupee symbol or ledger lines inside
    if (ny >= 0.60 && ny <= 0.63 && Math.abs(nx - 0.5) <= 0.16) {
      return [bgR, bgG, bgB, 255]; // Header line
    }
    // Rupee crossbar
    if (ny >= 0.67 && ny <= 0.69 && Math.abs(nx - 0.5) <= 0.12) {
      return [bgR, bgG, bgB, 255];
    }
    return [255, 255, 255, 255];
  }

  // Green checkmark badge on bottom right
  const bdx = nx - 0.70;
  const bdy = ny - 0.72;
  const bDist = Math.sqrt(bdx * bdx + bdy * bdy);
  if (bDist <= 0.10) {
    if (bDist >= 0.08) return [255, 255, 255, 255]; // white border
    return [34, 197, 94, 255]; // green badge
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate icons
console.log('Generating pwa-192x192.png...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, (x, y, w, h) => drawIcon(x, y, w, h, false)));

console.log('Generating pwa-512x512.png...');
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, (x, y, w, h) => drawIcon(x, y, w, h, false)));

console.log('Generating pwa-maskable-512x512.png...');
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, (x, y, w, h) => drawIcon(x, y, w, h, true)));

console.log('Generating apple-touch-icon.png...');
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, (x, y, w, h) => drawIcon(x, y, w, h, false)));

console.log('Generating favicon.ico...');
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(48, 48, (x, y, w, h) => drawIcon(x, y, w, h, false)));

console.log('Done generating all compliant PNG icons!');
