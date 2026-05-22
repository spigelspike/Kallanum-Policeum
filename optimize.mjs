import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function optimizeImages(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      await optimizeImages(fullPath);
    } else if (file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')) {
      const webpPath = fullPath.substring(0, fullPath.lastIndexOf('.')) + '.webp';
      
      console.log(`Converting ${file} to WebP...`);
      await sharp(fullPath)
        .webp({ quality: 80, effort: 6 })
        .toFile(webpPath);
        
      console.log(`Deleting original ${file}...`);
      fs.unlinkSync(fullPath);
    }
  }
}

optimizeImages('./src/assets').then(() => console.log('Done!')).catch(console.error);
