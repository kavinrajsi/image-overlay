import express from 'express';
import { createCanvas, loadImage, registerFont } from 'canvas';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

registerFont('./fonts/FiraCode-Medium.ttf', { family: 'Fira Code' });

const app = express();
const port = process.env.PORT || 3000;

const WIDTH = 1080;
const HEIGHT = 1080;
const FALLBACK_IMAGE_PATH = path.resolve('./fallback.jpg');

app.get('/generate', async (req, res) => {
  const quoteText = req.query.quote || 'Life is what happens when you’re busy making other plans.';
  const authorName = req.query.author || 'John Lennon';

  try {
    // Load fallback image locally
    const image = await loadImage(FALLBACK_IMAGE_PATH);

    // Prepare canvas and draw
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    // Draw fallback image as background
    ctx.drawImage(image, 0, 0, WIDTH, HEIGHT);

    // Draw black overlay with 80% opacity
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw quote text
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

    const quoteBottom = wrapText(quoteText, WIDTH / 2, 350, 900, 60);

    // Draw author text
    ctx.font = '36px "Fira Code"';
    ctx.fillText(`– ${authorName}`, WIDTH / 2, quoteBottom + 30);

    // Send image as JPEG in response
    res.set('Content-Type', 'image/jpeg');
    canvas.createJPEGStream().pipe(res);

  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error.message || 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
