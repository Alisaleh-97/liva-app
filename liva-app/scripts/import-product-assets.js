/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const pairs = process.argv.slice(2);
if (!pairs.length || pairs.length % 2 !== 0) {
  throw new Error('Usage: node scripts/import-product-assets.js <source.png> <name.png> [...]');
}

const outputDir = path.resolve(__dirname, '..', 'assets', 'products');
fs.mkdirSync(outputDir, { recursive: true });

function resizeBilinear(source, size) {
  const output = new PNG({ width: size, height: size, colorType: 6 });
  const xScale = (source.width - 1) / Math.max(1, size - 1);
  const yScale = (source.height - 1) / Math.max(1, size - 1);
  for (let y = 0; y < size; y += 1) {
    const fy = y * yScale;
    const y0 = Math.floor(fy);
    const y1 = Math.min(source.height - 1, y0 + 1);
    const wy = fy - y0;
    for (let x = 0; x < size; x += 1) {
      const fx = x * xScale;
      const x0 = Math.floor(fx);
      const x1 = Math.min(source.width - 1, x0 + 1);
      const wx = fx - x0;
      const target = (y * size + x) * 4;
      const indices = [
        (y0 * source.width + x0) * 4,
        (y0 * source.width + x1) * 4,
        (y1 * source.width + x0) * 4,
        (y1 * source.width + x1) * 4,
      ];
      for (let channel = 0; channel < 4; channel += 1) {
        const top = source.data[indices[0] + channel] * (1 - wx) + source.data[indices[1] + channel] * wx;
        const bottom = source.data[indices[2] + channel] * (1 - wx) + source.data[indices[3] + channel] * wx;
        output.data[target + channel] = Math.round(top * (1 - wy) + bottom * wy);
      }
    }
  }
  return output;
}

for (let index = 0; index < pairs.length; index += 2) {
  const sourcePath = path.resolve(pairs[index]);
  const outputName = path.basename(pairs[index + 1]);
  const source = PNG.sync.read(fs.readFileSync(sourcePath));
  const output = resizeBilinear(source, 768);
  const outputPath = path.join(outputDir, outputName);
  fs.writeFileSync(outputPath, PNG.sync.write(output, { deflateLevel: 9 }));
  console.log(`created assets/products/${outputName}`);
}

