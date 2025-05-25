import fs from 'fs';
import fetch from 'node-fetch';
import { createCanvas, loadImage, registerFont } from 'canvas';
import dotenv from 'dotenv';

dotenv.config();

// Register Fira Code font
registerFont('./fonts/FiraCode-Medium.ttf', { family: 'Fira Code' });

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

if (!UNSPLASH_ACCESS_KEY) {
  console.error('Error: UNSPLASH_ACCESS_KEY is not defined in .env');
  process.exit(1);
}

const [,, quoteText, authorName] = process.argv;

async function overlayQuote() {
  const width = 1080;
  const height = 1080;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  try {
    const res = await fetch(`https://api.unsplash.com/photos/random?query=nature&orientation=squarish&client_id=${UNSPLASH_ACCESS_KEY}`);
    const data = await res.json();
    const imageUrl = data?.urls?.regular;

    if (!imageUrl) throw new Error('Image URL not found from Unsplash response');

    const imageRes = await fetch(imageUrl);
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const image = await loadImage(buffer);

    ctx.drawImage(image, 0, 0, width, height);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Use Fira Code font
    ctx.font = 'bold 48px "Fira Code"';

    function wrapText(text, x, y, maxWidth, lineHeight) {
      const words = text.split(' ');
      let line = '';
      const lines = [];

      for (let word of words) {
        const testLine = `${line}${word} `;
        if (ctx.measureText(testLine).width > maxWidth) {
          lines.push(line);
          line = `${word} `;
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      lines.forEach((line, i) => {
        ctx.fillText(line.trim(), x, y + i * lineHeight);
      });

      return y + lines.length * lineHeight;
    }

    const quoteBottom = wrapText(quoteText, width / 2, 350, 900, 60);

    ctx.font = '36px "Fira Code"';
    ctx.fillText(`– ${authorName}`, width / 2, quoteBottom + 30);

    const out = fs.createWriteStream('output.jpg');
    const stream = canvas.createJPEGStream();
    stream.pipe(out);
    out.on('finish', () => console.log('Image saved as output.jpg'));
  } catch (err) {
    console.error('Error generating image:', err.message);
    process.exit(1);
  }
}

overlayQuote();
