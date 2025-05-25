import express from 'express';
import fetch from 'node-fetch';
import { createCanvas, loadImage, registerFont } from 'canvas';
import dotenv from 'dotenv';

dotenv.config();

registerFont('./fonts/FiraCode-Regular.ttf', { family: 'Fira Code' });

const app = express();
const port = process.env.PORT || 3000;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

if (!UNSPLASH_ACCESS_KEY) {
  console.error('Missing UNSPLASH_ACCESS_KEY');
  process.exit(1);
}

app.get('/generate', async (req, res) => {
  const quoteText = req.query.quote || 'Life is what happens when you’re busy making other plans.';
  const authorName = req.query.author || 'John Lennon';

  const width = 1080;
  const height = 1080;

  try {
    const resUnsplash = await fetch(`https://api.unsplash.com/photos/random?query=nature&orientation=squarish&client_id=${UNSPLASH_ACCESS_KEY}`);
    const data = await resUnsplash.json();
    const imageUrl = data?.urls?.regular;

    if (!imageUrl) throw new Error('Could not get image from Unsplash');

    const imageRes = await fetch(imageUrl);
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    const image = await loadImage(buffer);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(image, 0, 0, width, height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; // black overlay 80%
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
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

    // Send image as JPEG in response
    res.set('Content-Type', 'image/jpeg');
    canvas.createJPEGStream().pipe(res);

  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
