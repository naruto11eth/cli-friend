// Generates a 512x512 source PNG (no external deps) for `tauri icon`.
// A dark rounded tile with a green ">" prompt and an underscore cursor.
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

const S = 512;

function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax,
    dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  const qx = ax + t * dx,
    qy = ay + t * dy;
  return Math.hypot(px - qx, py - qy);
}

function pixel(x, y) {
  // Rounded-corner mask (transparent outside the radius).
  const r = 96;
  const cxs = [r, S - r];
  const cys = [r, S - r];
  let inside = true;
  for (const cx of cxs)
    for (const cy of cys) {
      const nearX = (cx === r && x < r) || (cx === S - r && x > S - r);
      const nearY = (cy === r && y < r) || (cy === S - r && y > S - r);
      if (nearX && nearY && Math.hypot(x - cx, y - cy) > r) inside = false;
    }
  if (!inside) return [0, 0, 0, 0];

  // Background.
  let col = [30, 33, 39, 255];

  // ">" chevron (two strokes).
  const d = Math.min(
    distToSeg(x, y, 150, 150, 330, 256),
    distToSeg(x, y, 330, 256, 150, 362)
  );
  if (d < 24) col = [126, 211, 33, 255];

  // Underscore cursor.
  if (y > 372 && y < 396 && x > 150 && x < 372) col = [126, 211, 33, 255];

  return col;
}

// Build raw RGBA scanlines with a 0 filter byte per row.
const raw = Buffer.alloc((S * 4 + 1) * S);
let o = 0;
for (let y = 0; y < S; y++) {
  raw[o++] = 0;
  for (let x = 0; x < S; x++) {
    const [r, g, b, a] = pixel(x, y);
    raw[o++] = r;
    raw[o++] = g;
    raw[o++] = b;
    raw[o++] = a;
  }
}

// CRC table for PNG chunks.
const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0);
ihdr.writeUInt32BE(S, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // RGBA
const png = Buffer.concat([
  sig,
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const out = path.join(__dirname, "..", "app-icon.png");
fs.writeFileSync(out, png);
console.log("wrote", out, png.length, "bytes");
