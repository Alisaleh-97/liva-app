/* eslint-disable no-console */
// Builds every Expo image from the two high-resolution LIVA brand masters.
// The generated mark arrived on a checkerboard preview, so this script also
// derives a clean alpha mask for adaptive, splash, and notification artwork.

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

function read(name) {
  return PNG.sync.read(fs.readFileSync(path.join(ASSETS, name)));
}

function write(name, image) {
  fs.writeFileSync(path.join(ASSETS, name), PNG.sync.write(image));
  console.log(`created assets/${name} (${image.width}x${image.height})`);
}

function resize(source, width, height) {
  const output = new PNG({ width, height, colorType: 6 });
  for (let y = 0; y < height; y += 1) {
    const sy = Math.min(source.height - 1, Math.floor((y / height) * source.height));
    for (let x = 0; x < width; x += 1) {
      const sx = Math.min(source.width - 1, Math.floor((x / width) * source.width));
      const sourceIndex = (sy * source.width + sx) * 4;
      const targetIndex = (y * width + x) * 4;
      output.data[targetIndex] = source.data[sourceIndex];
      output.data[targetIndex + 1] = source.data[sourceIndex + 1];
      output.data[targetIndex + 2] = source.data[sourceIndex + 2];
      output.data[targetIndex + 3] = source.data[sourceIndex + 3];
    }
  }
  return output;
}

function transparentMark(source, monochrome = false) {
  const output = new PNG({ width: source.width, height: source.height, colorType: 6 });
  for (let i = 0; i < source.data.length; i += 4) {
    const r = source.data[i];
    const g = source.data[i + 1];
    const b = source.data[i + 2];
    const brightness = Math.max(r, g, b);
    const chroma = brightness - Math.min(r, g, b);
    const isCheckerboard = brightness > 205 && chroma < 28;
    const alpha = isCheckerboard ? 0 : source.data[i + 3];

    output.data[i] = monochrome ? 255 : r;
    output.data[i + 1] = monochrome ? 255 : g;
    output.data[i + 2] = monochrome ? 255 : b;
    output.data[i + 3] = alpha;
  }
  return output;
}

const iconMaster = read('brand-icon-master.png');
const markMaster = transparentMark(read('brand-mark-master.png'));
const notificationMaster = transparentMark(read('brand-mark-master.png'), true);

write('icon.png', resize(iconMaster, 1024, 1024));
write('adaptive-icon.png', resize(markMaster, 1024, 1024));
write('splash.png', resize(markMaster, 1024, 1024));
write('notification-icon.png', resize(notificationMaster, 96, 96));
write('favicon.png', resize(iconMaster, 64, 64));

