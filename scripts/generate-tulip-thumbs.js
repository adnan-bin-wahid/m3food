const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createThumb(sourcePath, destPath, options = {}) {
  const { paddingPercent = 0.08, bgCenter = '#52142a', bgEdge = '#18040d', offsetY = 0 } = options;
  const size = 240;
  
  // 1. Trim transparent padding from source image
  const trimmed = await sharp(sourcePath).trim().toBuffer({ resolveWithObject: true });
  const origW = trimmed.info.width;
  const origH = trimmed.info.height;
  
  // 2. Scale to fit within size bounds
  const maxDim = size * (1 - paddingPercent * 2);
  const scale = Math.min(maxDim / origW, maxDim / origH);
  const fitW = Math.round(origW * scale);
  const fitH = Math.round(origH * scale);
  
  const resizedProd = await sharp(trimmed.data)
    .resize(fitW, fitH, { fit: 'inside' })
    .toBuffer();
    
  // 3. Create radial gradient luxury background
  const bgSvg = Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="grad" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stop-color="${bgCenter}" stop-opacity="1" />
          <stop offset="65%" stop-color="#2c0817" stop-opacity="1" />
          <stop offset="100%" stop-color="${bgEdge}" stop-opacity="1" />
        </radialGradient>
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" result="blur" />
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
      <circle cx="${size / 2}" cy="${size / 2 + offsetY}" r="${size / 3.2}" fill="#ff8fa3" opacity="0.22" filter="url(#softGlow)" />
    </svg>
  `);
  
  const left = Math.round((size - fitW) / 2);
  const top = Math.round((size - fitH) / 2) + offsetY;
  
  await sharp(bgSvg)
    .composite([
      { input: resizedProd, left: Math.max(0, left), top: Math.max(0, top) }
    ])
    .png()
    .toFile(destPath);
    
  console.log('Successfully generated:', destPath, `${fitW}x${fitH}`);
}

async function run() {
  const baseDir = path.resolve(__dirname, '../public/niyamah/tulip-showcase');
  
  // 1. Hijab: use real Bexi Cotton Salat Hijab, cropped nicely to emphasize the prayer gown
  await createThumb(
    path.join(baseDir, 'combo-hijab.png'),
    path.join(baseDir, 'thumb-bexi-hijab.png'),
    { paddingPercent: 0.03, offsetY: 0, bgCenter: '#631833' }
  );
  
  // 2. Perfume: use real Orchid perfume & luxury cylinder
  await createThumb(
    path.join(baseDir, 'combo-perfume.png'),
    path.join(baseDir, 'thumb-perfume.png'),
    { paddingPercent: 0.03, offsetY: 0, bgCenter: '#5e1630' }
  );
  
  // 3. Gift Bag: use real signature Tulip tote gift bag
  await createThumb(
    path.join(baseDir, 'combo-bag.png'),
    path.join(baseDir, 'thumb-bag.png'),
    { paddingPercent: 0.03, offsetY: 0, bgCenter: '#58142c' }
  );
}

run().catch(console.error);
