import * as THREE from 'three';
import {
  makeCanvasTexture,
  roundRect,
  drawStar,
  drawCrescent,
  japaneseFont,
  spacedText,
  PALETTE,
} from './core.js';

/* ------------------------------------------------------------------ *
 *  Surfaces
 * ------------------------------------------------------------------ */

function seededNoise(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export function makeAsphaltTexture() {
  return makeCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, '#2b3345');
      gradient.addColorStop(0.5, '#232a39');
      gradient.addColorStop(1, '#2a3244');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      // broad damp patches
      for (let i = 0; i < 22; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 20 + Math.random() * 90;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(80,104,138,${0.03 + Math.random() * 0.05})`);
        g.addColorStop(1, 'rgba(80,104,138,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }

      // aggregate speckles
      for (let i = 0; i < 9000; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const v = seededNoise(i, 3.7);
        const light = v > 0.55;
        ctx.fillStyle = light
          ? `rgba(160,178,202,${0.03 + v * 0.08})`
          : `rgba(5,9,16,${0.08 + v * 0.16})`;
        const s = 0.6 + v * 1.8;
        ctx.fillRect(x, y, s, s);
      }

      // faint long wet sheen
      for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.globalAlpha = 0.035 + Math.random() * 0.03;
        ctx.fillStyle = '#9db7d9';
        ctx.translate(Math.random() * w, 0);
        ctx.rotate((Math.random() - 0.5) * 0.15);
        ctx.fillRect(0, -h, 8 + Math.random() * 22, h * 3);
        ctx.restore();
      }

      // hairline cracks
      ctx.strokeStyle = 'rgba(8,12,20,0.35)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        let x = Math.random() * w;
        let y = Math.random() * h;
        ctx.moveTo(x, y);
        for (let k = 0; k < 8; k++) {
          x += (Math.random() - 0.5) * 26;
          y += 8 + Math.random() * 18;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
    { repeat: [3, 3] }
  );
}

export function makePavementTexture() {
  return makeCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#657081';
      ctx.fillRect(0, 0, w, h);
      const tile = 64;
      for (let y = 0; y < h / tile; y++) {
        for (let x = 0; x < w / tile; x++) {
          const n = seededNoise(x, y);
          const shade = 96 + Math.floor(n * 28);
          ctx.fillStyle = `rgb(${shade - 8},${shade + 2},${shade + 15})`;
          ctx.fillRect(x * tile + 1.5, y * tile + 1.5, tile - 3, tile - 3);
          // damp mottling
          const g = ctx.createLinearGradient(
            x * tile,
            y * tile,
            (x + 1) * tile,
            (y + 1) * tile
          );
          g.addColorStop(0, 'rgba(40,58,82,0.08)');
          g.addColorStop(1, 'rgba(170,190,210,0.05)');
          ctx.fillStyle = g;
          ctx.fillRect(x * tile + 1.5, y * tile + 1.5, tile - 3, tile - 3);
        }
      }
      for (let i = 0; i < 2600; i++) {
        ctx.fillStyle = `rgba(30,42,58,${Math.random() * 0.1})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2);
      }
      // wet streaks
      ctx.globalAlpha = 0.07;
      for (let i = 0; i < 8; i++) {
        const x = Math.random() * w;
        const g = ctx.createLinearGradient(x, 0, x + 24, h);
        g.addColorStop(0, 'rgba(180,205,230,0)');
        g.addColorStop(0.5, 'rgba(180,205,230,0.8)');
        g.addColorStop(1, 'rgba(180,205,230,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x, 0, 14 + Math.random() * 30, h);
      }
      ctx.globalAlpha = 1;
    },
    { repeat: [4, 4] }
  );
}

export function makeAlleyTexture() {
  return makeCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#343b45');
      g.addColorStop(1, '#242a33');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 4500; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        ctx.fillStyle = `rgba(10,14,20,${Math.random() * 0.18})`;
        ctx.fillRect(x, y, 1.4, 1.4);
      }
      ctx.strokeStyle = 'rgba(12,16,22,0.5)';
      ctx.lineWidth = 2;
      for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo((i * w) / 5, 0);
        ctx.lineTo((i * w) / 5, h);
        ctx.stroke();
      }
      for (let i = 1; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (i * h) / 6);
        ctx.lineTo(w, (i * h) / 6);
        ctx.stroke();
      }
      // drain channel
      ctx.fillStyle = 'rgba(14,19,26,0.8)';
      ctx.fillRect(w * 0.42, 0, 34, h);
      ctx.fillStyle = 'rgba(120,140,160,0.14)';
      for (let y = 6; y < h; y += 18) ctx.fillRect(w * 0.42, y, 34, 5);
    },
    { repeat: [2, 2] }
  );
}

export function makeStoreFloorTexture() {
  return makeCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#d9cfae';
      ctx.fillRect(0, 0, w, h);
      const tile = 64;
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const n = seededNoise(x + 4, y + 8);
          const r = 222 + Math.floor(n * 14);
          const g = 210 + Math.floor(n * 14);
          const b = 176 + Math.floor(n * 12);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x * tile + 1, y * tile + 1, tile - 2, tile - 2);
          if (n > 0.7) {
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(x * tile + 6, y * tile + 6, tile - 12, 3);
          }
        }
      }
      ctx.strokeStyle = 'rgba(120,110,84,0.25)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 8; i++) {
        ctx.beginPath();
        ctx.moveTo(i * tile, 0);
        ctx.lineTo(i * tile, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * tile);
        ctx.lineTo(w, i * tile);
        ctx.stroke();
      }
    },
    { repeat: [4, 4] }
  );
}

export function makeApartmentWallTexture() {
  return makeCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#5d6674';
      ctx.fillRect(0, 0, w, h);
      const bw = 64;
      const bh = 32;
      for (let row = 0; row < 16; row++) {
        for (let col = -1; col < 9; col++) {
          const offset = row % 2 === 0 ? 0 : bw / 2;
          const n = seededNoise(col + 10, row + 3);
          const shade = 82 + Math.floor(n * 18);
          ctx.fillStyle = `rgb(${shade},${shade + 6},${shade + 16})`;
          ctx.fillRect(col * bw + offset + 1.5, row * bh + 1.5, bw - 3, bh - 3);
        }
      }
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = `rgba(20,26,34,${0.02 + Math.random() * 0.05})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 20 + Math.random() * 80, 6 + Math.random() * 30);
      }
    },
    { repeat: [2, 3] }
  );
}

export function makeShutterTexture() {
  return makeCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#4c5664';
      ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 10) {
        const g = ctx.createLinearGradient(0, y, 0, y + 10);
        g.addColorStop(0, '#65707f');
        g.addColorStop(0.45, '#4a5360');
        g.addColorStop(1, '#333b47');
        ctx.fillStyle = g;
        ctx.fillRect(0, y, w, 9);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(0, 0, w, 4);
      // scuffs
      for (let i = 0; i < 80; i++) {
        ctx.fillStyle = `rgba(20,24,30,${Math.random() * 0.2})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 20, 1);
      }
    },
    { repeat: [2, 1] }
  );
}

export function makeAwningTexture() {
  return makeCanvasTexture(
    512,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#e7ddc4';
      ctx.fillRect(0, 0, w, h);
      const stripe = 64;
      for (let x = 0; x < w + stripe; x += stripe * 2) {
        ctx.fillStyle = '#2d7a68';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + stripe, 0);
        ctx.lineTo(x + stripe - 24, h);
        ctx.lineTo(x - 24, h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(30,40,48,0.12)';
      for (let i = 0; i < 40; i++) {
        ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 10, 1 + Math.random() * 3);
      }
    },
    { repeat: [2, 1] }
  );
}

export function makeTactileTexture() {
  return makeCanvasTexture(
    128,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#c7a93d';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,240,160,0.4)';
      for (let y = 16; y < h; y += 24) {
        for (let x = 16; x < w; x += 24) {
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = 'rgba(90,70,20,0.12)';
      ctx.fillRect(0, 0, w, 3);
    },
    { repeat: [4, 1] }
  );
}

/* ------------------------------------------------------------------ *
 *  Store signage
 * ------------------------------------------------------------------ */

export function makeStoreSignTexture() {
  return makeCanvasTexture(2048, 256, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#163654');
    bg.addColorStop(0.55, '#0d243c');
    bg.addColorStop(1, '#091a2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // glow lines
    const halo = ctx.createLinearGradient(0, 0, 0, h);
    halo.addColorStop(0, 'rgba(120,255,220,0.20)');
    halo.addColorStop(0.12, 'rgba(120,255,220,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);

    // border
    ctx.strokeStyle = '#4fe0bd';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.strokeRect(26, 26, w - 52, h - 52);

    // logo
    const logoX = 178;
    const logoY = h / 2;
    drawCrescent(ctx, logoX, logoY, 64, '#ffe6a6');
    drawStar(ctx, logoX + 28, logoY - 20, 22, 9, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = japaneseFont(23, 700);
    ctx.textAlign = 'center';
    ctx.fillText('HOSHIZORA', logoX, logoY + 104);

    // title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.shadowColor = 'rgba(126,255,224,0.7)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#f6fff9';
    ctx.font = japaneseFont(112, 900);
    spacedText(ctx, 'ほしぞらマート', 1110, 118, 12);
    ctx.restore();

    ctx.fillStyle = 'rgba(232,255,246,0.78)';
    ctx.font = '600 27px "Trebuchet MS", "Yu Gothic", sans-serif';
    ctx.save();
    ctx.letterSpacing = '10px';
    ctx.fillText('H O S H I Z O R A   M A R T', 1110, 194);
    ctx.restore();

    // 24H badge
    ctx.fillStyle = '#ff9664';
    roundRect(ctx, 1740, 58, 210, 82, 41);
    ctx.fill();
    ctx.fillStyle = '#1a130e';
    ctx.font = '900 54px "Yu Gothic", sans-serif';
    ctx.fillText('24H', 1845, 102);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '600 19px "Trebuchet MS", sans-serif';
    ctx.fillText('OPEN EVERYDAY', 1845, 169);

    // mint / coral bands
    ctx.fillStyle = '#45d6b0';
    ctx.fillRect(0, h - 20, w, 8);
    ctx.fillStyle = '#ff8c5c';
    ctx.fillRect(0, h - 10, w, 4);

    // glass reflection
    const shine = ctx.createLinearGradient(500, 0, 1500, 0);
    shine.addColorStop(0, 'rgba(255,255,255,0)');
    shine.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(0, 0, w, h);
  });
}

export function makePylonTexture() {
  return makeCanvasTexture(384, 1024, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#153b58');
    bg.addColorStop(0.55, '#0b243a');
    bg.addColorStop(1, '#09192a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#4fe0bd';
    ctx.lineWidth = 7;
    roundRect(ctx, 12, 12, w - 24, h - 24, 20);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    roundRect(ctx, 26, 26, w - 52, h - 52, 14);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.save();
    ctx.shadowColor = '#ff9d74';
    ctx.shadowBlur = 26;
    ctx.fillStyle = '#ffb28b';
    ctx.font = '900 108px "Trebuchet MS", sans-serif';
    ctx.fillText('24H', w / 2, 126);
    ctx.restore();

    ctx.fillStyle = 'rgba(230,255,248,0.65)';
    ctx.font = '600 23px "Trebuchet MS", sans-serif';
    ctx.fillText('OPEN EVERYDAY', w / 2, 196);

    drawCrescent(ctx, w / 2 - 6, 292, 52, '#ffe3a1');
    drawStar(ctx, w / 2 + 36, 265, 17, 7, 5);

    const chars = ['ほ', 'し', 'ぞ', 'ら', 'マ', 'ー', 'ト'];
    ctx.font = japaneseFont(74, 800);
    chars.forEach((ch, i) => {
      ctx.save();
      ctx.shadowColor = 'rgba(120,255,225,0.65)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#f4fffa';
      if (ch === 'ー') {
        ctx.translate(w / 2, 420 + i * 68);
        ctx.rotate(Math.PI / 2);
        ctx.fillText(ch, 0, 0);
      } else {
        ctx.fillText(ch, w / 2, 420 + i * 68);
      }
      ctx.restore();
    });

    ctx.fillStyle = '#45d6b0';
    ctx.fillRect(24, h - 104, w - 48, 7);
    ctx.fillStyle = '#ff8c5c';
    ctx.fillRect(24, h - 88, w - 48, 4);
    ctx.fillStyle = 'rgba(235,255,248,0.7)';
    ctx.font = '600 20px "Trebuchet MS", sans-serif';
    ctx.fillText('ATM  /  COPY  /  TICKETS', w / 2, h - 48);
  });
}

/* ------------------------------------------------------------------ *
 *  Posters, magazines, shelf talkers
 * ------------------------------------------------------------------ */

export function makeSodaPosterTexture() {
  return makeCanvasTexture(512, 768, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#101b3f');
    bg.addColorStop(0.5, '#3d2b72');
    bg.addColorStop(1, '#d8739b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // stars
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.7})`;
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h * 0.62, Math.random() * 1.8 + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // moon
    drawCrescent(ctx, 385, 142, 58, '#ffe9ad');

    // can
    const cx = 256;
    const cy = 470;
    const canW = 150;
    const canH = 300;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.12);
    const can = ctx.createLinearGradient(-canW / 2, 0, canW / 2, 0);
    can.addColorStop(0, '#66708c');
    can.addColorStop(0.25, '#e8f3ff');
    can.addColorStop(0.5, '#8ad8f5');
    can.addColorStop(0.75, '#4b82c8');
    can.addColorStop(1, '#5a6178');
    ctx.fillStyle = can;
    roundRect(ctx, -canW / 2, -canH / 2, canW, canH, 28);
    ctx.fill();
    ctx.fillStyle = 'rgba(6,18,40,0.82)';
    roundRect(ctx, -canW / 2 + 12, -canH / 2 + 24, canW - 24, canH - 48, 20);
    ctx.fill();
    ctx.fillStyle = '#8fe6ff';
    ctx.font = japaneseFont(44, 900);
    ctx.textAlign = 'center';
    ctx.fillText('星空', 0, -26);
    ctx.fillStyle = '#ffc4dc';
    ctx.fillText('ソーダ', 0, 26);
    drawStar(ctx, 0, 80, 22, 9, 5);
    ctx.fillStyle = '#d9ecff';
    ctx.font = '600 20px "Trebuchet MS", sans-serif';
    ctx.fillText('HOSHIZORA SODA', 0, 122);
    // rim
    ctx.fillStyle = '#cfd8e6';
    ctx.beginPath();
    ctx.ellipse(0, -canH / 2 + 2, canW / 2, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff7e8';
    ctx.font = japaneseFont(76, 900);
    ctx.fillText('星空ソーダ', w / 2, 112);
    ctx.fillStyle = '#ffd166';
    ctx.font = japaneseFont(40, 800);
    ctx.fillText('新発売', w / 2, 182);

    ctx.fillStyle = '#10243b';
    ctx.fillRect(0, h - 112, w, 112);
    ctx.fillStyle = '#8fe6ff';
    ctx.font = japaneseFont(28, 700);
    ctx.fillText('期間限定 ・ 冷やして最高', w / 2, h - 62);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '600 21px "Trebuchet MS", sans-serif';
    ctx.fillText('HOSHIZORA MART  /  LIMITED', w / 2, h - 28);
  });
}

export function makeOdenPosterTexture() {
  return makeCanvasTexture(512, 768, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#fff2d8');
    bg.addColorStop(0.65, '#ffd9a0');
    bg.addColorStop(1, '#f6b870');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // steam
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(170 + i * 84, 300);
      ctx.bezierCurveTo(135 + i * 84, 250, 205 + i * 84, 220, 170 + i * 84, 170);
      ctx.stroke();
    }

    // pot
    ctx.fillStyle = '#4b3528';
    roundRect(ctx, 116, 330, 280, 200, 48);
    ctx.fill();
    ctx.fillStyle = '#6d4a36';
    ctx.beginPath();
    ctx.ellipse(256, 335, 142, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d38a3b';
    ctx.beginPath();
    ctx.ellipse(256, 337, 124, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    // skewers
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = '#f5e6c8';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(170 + i * 43, 344);
      ctx.lineTo(150 + i * 43, 290);
      ctx.stroke();
      ctx.fillStyle = ['#c98b45', '#e6b67a', '#f1e6cf', '#b86a43', '#d9aa6c'][i];
      ctx.beginPath();
      ctx.arc(168 + i * 43, 330, 17, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#8b5c3d';
    ctx.font = japaneseFont(35, 800);
    ctx.textAlign = 'center';
    ctx.fillText('あったか〜い', 256, 580);

    ctx.fillStyle = '#3f2a1c';
    ctx.font = japaneseFont(82, 900);
    ctx.fillText('おでん', 256, 110);
    ctx.fillStyle = '#c7472f';
    ctx.font = japaneseFont(42, 800);
    ctx.fillText('はじめました', 256, 180);

    ctx.fillStyle = 'rgba(63,42,28,0.9)';
    ctx.font = japaneseFont(25, 700);
    ctx.fillText('だいこん・たまご・こんにゃく・牛すじ', 256, 655);
    ctx.fillStyle = 'rgba(63,42,28,0.6)';
    ctx.font = '600 20px "Trebuchet MS", sans-serif';
    ctx.fillText('HOSHIZORA MART  OODEN', 256, 702);

    // border
    ctx.strokeStyle = 'rgba(112,65,32,0.35)';
    ctx.lineWidth = 6;
    ctx.strokeRect(18, 18, w - 36, h - 36);
  });
}

export function makeCoffeePosterTexture() {
  return makeCanvasTexture(512, 768, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#291b16');
    bg.addColorStop(0.55, '#4c2f24');
    bg.addColorStop(1, '#1b1210');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // cup
    ctx.fillStyle = '#f2e7d6';
    roundRect(ctx, 132, 360, 248, 210, 34);
    ctx.fill();
    ctx.fillStyle = '#6d3f26';
    ctx.beginPath();
    ctx.ellipse(256, 375, 124, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8dac7';
    ctx.beginPath();
    ctx.ellipse(256, 375, 100, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5c3320';
    ctx.beginPath();
    ctx.ellipse(256, 372, 78, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f2e7d6';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.arc(382, 450, 50, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();

    // steam
    ctx.strokeStyle = 'rgba(255,240,215,0.5)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.moveTo(210 + i * 90, 330);
      ctx.bezierCurveTo(180 + i * 90, 275, 250 + i * 90, 255, 215 + i * 90, 200);
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe2b0';
    ctx.font = japaneseFont(58, 900);
    ctx.fillText('淹れたて', 256, 96);
    ctx.fillStyle = '#fff9ed';
    ctx.font = japaneseFont(104, 900);
    ctx.fillText('コーヒー', 256, 202);
    ctx.fillStyle = '#e8a75a';
    ctx.font = 'italic 800 64px "Trebuchet MS", sans-serif';
    ctx.fillText('HOT  ¥100', 256, 278);

    ctx.fillStyle = '#ffd166';
    ctx.font = japaneseFont(30, 800);
    ctx.fillText('S 100円 / M 150円 / L 180円', 256, 652);
    ctx.fillStyle = 'rgba(255,245,225,0.6)';
    ctx.font = '600 20px "Trebuchet MS", sans-serif';
    ctx.fillText('FRESHLY BREWED EVERY MORNING', 256, 702);
  });
}

export function makeShelfSignTexture(label, bg = '#f08a55', fg = '#ffffff') {
  return makeCanvasTexture(640, 160, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(12,22,35,0.92)';
    roundRect(ctx, 4, 8, w - 8, h - 16, 16);
    ctx.fill();
    ctx.fillStyle = bg;
    roundRect(ctx, 12, 16, w - 24, h - 32, 12);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.13)';
    ctx.fillRect(24, 28, w - 48, 3);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = fg;
    ctx.font = japaneseFont(66, 800);
    ctx.fillText(label, w / 2, h / 2 + 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    roundRect(ctx, 22, 26, w - 44, h - 52, 8);
    ctx.stroke();
  });
}

export function makeWindowDecalTexture(type) {
  return makeCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (type === '24h') {
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.lineWidth = 15;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 170, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.96)';
      ctx.font = '900 170px "Trebuchet MS", sans-serif';
      ctx.fillText('24h', w / 2, h / 2 - 6);
      ctx.font = '700 40px "Yu Gothic", sans-serif';
      ctx.fillText('OPEN', w / 2, h / 2 + 100);
    } else if (type === 'atm') {
      ctx.fillStyle = 'rgba(46,108,206,0.92)';
      roundRect(ctx, 46, 146, w - 92, 220, 30);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 120px "Trebuchet MS", sans-serif';
      ctx.fillText('ATM', w / 2, h / 2 - 8);
      ctx.font = japaneseFont(40, 700);
      ctx.fillText('24時間', w / 2, h / 2 + 74);
    } else if (type === 'copy') {
      ctx.font = japaneseFont(78, 800);
      ctx.fillStyle = 'rgba(74,196,150,0.95)';
      roundRect(ctx, 36, 178, w - 72, 160, 24);
      ctx.fill();
      ctx.fillStyle = '#113929';
      ctx.fillText('コピー・FAX', w / 2, h / 2 - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '600 30px "Trebuchet MS", sans-serif';
      ctx.fillText('COPY  /  PRINT', w / 2, h / 2 + 66);
    } else if (type === 'point') {
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      roundRect(ctx, 30, 172, w - 60, 170, 22);
      ctx.fill();
      ctx.fillStyle = '#18324a';
      ctx.font = '900 72px "Trebuchet MS", sans-serif';
      ctx.fillText('HOSHI', w / 2, h / 2 - 2);
      ctx.fillStyle = '#f08a55';
      ctx.font = japaneseFont(40, 800);
      ctx.fillText('ポイントカード', w / 2, h / 2 + 64);
    }
  });
}

export function makeMagazineCoverTexture(index) {
  const palettes = [
    ['#ff7a8a', '#ffe8cf', '#2c1830', '週刊 星'],
    ['#7fd7ff', '#123f73', '#f7f2dd', 'アニメ!'],
    ['#ffd98a', '#5b3b20', '#fff7e8', 'ネコ生活'],
    ['#b9a7ff', '#281d4e', '#ffe4f0', '雨の日'],
    ['#f4f1e3', '#1e2430', '#ff5c73', 'MANGA'],
    ['#7ed9b4', '#0d3b34', '#ffefdb', '旅する'],
    ['#ffb06a', '#33180e', '#fff4db', 'MUSIC'],
    ['#8fa8ff', '#182a5a', '#ffd0e0', 'ゲーム'],
  ];
  const [accent, bg, fg, title] = palettes[index % palettes.length];
  return makeCanvasTexture(256, 340, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // masthead
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, w, 58);
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = japaneseFont(34, 900);
    ctx.fillText(title, w / 2, 31);

    // image block
    const g = ctx.createLinearGradient(0, 58, w, h);
    g.addColorStop(0, accent);
    g.addColorStop(1, 'rgba(255,255,255,0.10)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 58, w, h * 0.62);
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.42, w * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(20,26,36,0.35)';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.42, w * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // cover lines
    ctx.textAlign = 'left';
    for (let i = 0; i < 4; i++) {
      const y = h * 0.68 + i * 26;
      ctx.fillStyle = i === 0 ? '#fff6e2' : 'rgba(255,255,255,0.7)';
      ctx.font = i === 0 ? japaneseFont(19, 900) : japaneseFont(15, 600);
      const lines = ['今月の特集', '雨の街と、', '小さな幸せ', 'SPECIAL FEATURE'];
      ctx.fillText(lines[i], 14, y);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(8, h - 26, w - 16, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '600 11px "Trebuchet MS", sans-serif';
    ctx.fillText('NIGHT EDITION', 12, h - 12);
  });
}

/* ------------------------------------------------------------------ *
 *  Vending machine, notice board, street signs
 * ------------------------------------------------------------------ */

export function makeVendingFrontTexture(brandColor = '#d94c55') {
  return makeCanvasTexture(512, 768, (ctx, w, h) => {
    ctx.fillStyle = '#f2f0e9';
    ctx.fillRect(0, 0, w, h);

    // header
    const head = ctx.createLinearGradient(0, 0, 0, 110);
    head.addColorStop(0, brandColor);
    head.addColorStop(1, '#a92f3c');
    ctx.fillStyle = head;
    ctx.fillRect(0, 0, w, 110);
    ctx.fillStyle = '#fff6e9';
    ctx.font = '900 43px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('COOL MART', w / 2, 42);
    ctx.font = japaneseFont(23, 700);
    ctx.fillText('つめた〜い ドリンク', w / 2, 83);

    // display window
    ctx.fillStyle = '#e9f8ff';
    roundRect(ctx, 28, 132, w - 56, 380, 18);
    ctx.fill();
    const colors = [
      '#e05a4f', '#4b8fe2', '#f6c945', '#56b877', '#dd7cb1', '#6c5bd4',
      '#f29a3d', '#48c8c4', '#e6e2d8', '#86a644', '#d8654f', '#7a95e8',
    ];
    const cols = 4;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const x = 56 + col * 104;
        const y = 166 + row * 112;
        ctx.fillStyle = colors[idx % colors.length];
        roundRect(ctx, x, y, 52, 86, 8);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.fillRect(x + 8, y + 20, 36, 5);
        ctx.fillStyle = 'rgba(20,30,40,0.4)';
        ctx.fillRect(x + 10, y + 52, 32, 14);
        ctx.fillStyle = '#1f3448';
        ctx.font = '700 15px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`¥${[130, 150, 160, 180][idx % 4]}`, x + 26, y + 103);
        // button
        ctx.fillStyle = idx === 5 ? '#4fd6b2' : '#d8dee5';
        ctx.fillRect(x + 10, y - 16, 32, 9);
      }
    }

    // coin area
    ctx.fillStyle = '#2a3038';
    roundRect(ctx, 40, 548, 196, 126, 12);
    ctx.fill();
    ctx.fillStyle = '#171b21';
    roundRect(ctx, 58, 568, 66, 34, 8);
    ctx.fill();
    ctx.fillStyle = '#aab3bd';
    roundRect(ctx, 146, 566, 70, 52, 8);
    ctx.fill();
    ctx.fillStyle = '#20262d';
    ctx.fillRect(160, 578, 42, 8);
    ctx.fillStyle = '#ffb166';
    ctx.font = '700 18px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('COIN', 58, 626);
    ctx.fillText('CARD', 146, 626);
    ctx.fillStyle = '#4fd6b2';
    ctx.fillRect(58, 638, 158, 6);

    // dispensing slot
    ctx.fillStyle = '#313943';
    roundRect(ctx, 274, 560, 190, 106, 12);
    ctx.fill();
    ctx.fillStyle = '#10151b';
    roundRect(ctx, 294, 586, 150, 52, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(298, 596, 142, 3);

    // ambient glow
    const glowGrad = ctx.createLinearGradient(0, 132, 0, 512);
    glowGrad.addColorStop(0, 'rgba(220,250,255,0.35)');
    glowGrad.addColorStop(1, 'rgba(220,250,255,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(28, 132, w - 56, 380);
  });
}

export function makeNoticeboardTexture() {
  return makeCanvasTexture(768, 512, (ctx, w, h) => {
    // frame
    ctx.fillStyle = '#5a4432';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#b48b5d';
    ctx.fillRect(16, 16, w - 32, h - 32);
    // cork
    for (let i = 0; i < 4000; i++) {
      const v = 120 + Math.random() * 60;
      ctx.fillStyle = `rgba(${v},${v * 0.78},${v * 0.5},0.24)`;
      ctx.fillRect(16 + Math.random() * (w - 32), 16 + Math.random() * (h - 32), 2, 2);
    }

    // lost cat poster (story beat)
    ctx.save();
    ctx.translate(74, 56);
    ctx.rotate(-0.025);
    ctx.fillStyle = '#f7f1df';
    ctx.fillRect(0, 0, 212, 286);
    ctx.fillStyle = '#f2cf72';
    ctx.fillRect(0, 0, 212, 50);
    ctx.fillStyle = '#2f271e';
    ctx.textAlign = 'center';
    ctx.font = japaneseFont(27, 800);
    ctx.fillText('迷い猫', 106, 34);
    ctx.fillStyle = '#2b2620';
    // cat silhouette
    ctx.beginPath();
    ctx.ellipse(106, 148, 44, 52, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(106, 94, 33, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(82, 72); ctx.lineTo(72, 40); ctx.lineTo(102, 62); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(130, 72); ctx.lineTo(140, 40); ctx.lineTo(110, 62); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.arc(94, 92, 5, 0, Math.PI * 2);
    ctx.arc(118, 92, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#f2cf72';
    ctx.fill();
    ctx.strokeStyle = '#2b2620';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(126, 170);
    ctx.bezierCurveTo(172, 154, 178, 202, 148, 218);
    ctx.stroke();
    ctx.fillStyle = '#5a4a3a';
    ctx.font = japaneseFont(17, 600);
    ctx.fillText('黒猫 ・ 星野町あたり', 106, 238);
    ctx.font = japaneseFont(14, 500);
    ctx.fillText('見かけたら 080-0000-0000', 106, 262);
    ctx.fillStyle = '#d65745';
    ctx.beginPath(); ctx.arc(104, 18, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // event poster
    ctx.save();
    ctx.translate(330, 44);
    ctx.rotate(0.02);
    ctx.fillStyle = '#fbf5e6';
    ctx.fillRect(0, 0, 170, 218);
    ctx.fillStyle = '#2f5d8c';
    ctx.fillRect(0, 0, 170, 38);
    ctx.fillStyle = '#fff7e9';
    ctx.textAlign = 'center';
    ctx.font = japaneseFont(22, 800);
    ctx.fillText('星野町 秋祭り', 85, 27);
    ctx.fillStyle = '#ef8b5c';
    ctx.beginPath(); ctx.arc(85, 108, 52, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff0c9';
    ctx.beginPath(); ctx.arc(85, 108, 38, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d95b44';
    ctx.font = japaneseFont(30, 900);
    ctx.fillText('10.28', 85, 104);
    ctx.fillStyle = '#4a3b2c';
    ctx.font = japaneseFont(16, 600);
    ctx.fillText('18:00 〜 21:00', 85, 150);
    ctx.fillText('星野町商店街', 85, 178);
    ctx.fillStyle = '#d95b44';
    ctx.beginPath(); ctx.arc(83, 4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // small flyer
    ctx.save();
    ctx.translate(520, 82);
    ctx.rotate(-0.06);
    ctx.fillStyle = '#f4ead7';
    ctx.fillRect(0, 0, 172, 180);
    ctx.fillStyle = '#2c3e50';
    ctx.textAlign = 'center';
    ctx.font = japaneseFont(22, 800);
    ctx.fillText('お知らせ', 86, 30);
    ctx.fillStyle = '#6b6154';
    ctx.font = japaneseFont(15, 500);
    const lines = ['11月より ゴミ収集時間が', '変更になります。', '分別にご協力ください。'];
    lines.forEach((line, i) => ctx.fillText(line, 86, 76 + i * 26));
    ctx.strokeStyle = '#b8a98e';
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 46, 148, 104);
    ctx.fillStyle = '#d95b44';
    ctx.beginPath(); ctx.arc(84, 14, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // rain spots
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(60,80,95,${Math.random() * 0.1})`;
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 8, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function makeStreetSignTexture(type) {
  return makeCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    if (type === 'stop') {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-196, -118); ctx.lineTo(196, -118); ctx.lineTo(0, 208); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#d8402f';
      ctx.beginPath();
      ctx.moveTo(-178, -102); ctx.lineTo(178, -102); ctx.lineTo(0, 182); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fffdf5';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = japaneseFont(104, 900);
      ctx.fillText('止まれ', 0, 6);
      ctx.restore();
    } else if (type === 'parking') {
      ctx.fillStyle = '#2d67bb';
      roundRect(ctx, 46, 46, w - 92, h - 92, 28);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 12;
      roundRect(ctx, 70, 70, w - 140, h - 140, 18);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 290px "Trebuchet MS", sans-serif';
      ctx.fillText('P', w / 2, h / 2 - 32);
      ctx.font = japaneseFont(44, 700);
      ctx.fillText('24時間', w / 2, h - 140);
    } else if (type === 'street') {
      ctx.fillStyle = '#1d5f54';
      roundRect(ctx, 10, 170, w - 20, 172, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 6;
      ctx.strokeRect(26, 186, w - 52, 140);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = japaneseFont(58, 700);
      ctx.fillText('星野町 二丁目', w / 2, 230);
      ctx.font = '700 34px "Trebuchet MS", sans-serif';
      ctx.fillText('HOSHINO-CHO 2', w / 2, 290);
    } else if (type === 'bicycle') {
      ctx.fillStyle = '#2b5fa8';
      roundRect(ctx, 50, 50, w - 100, h - 100, 30);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 14;
      ctx.beginPath(); ctx.arc(160, 330, 70, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(352, 330, 70, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(160, 330); ctx.lineTo(238, 210); ctx.lineTo(352, 330); ctx.lineTo(276, 330); ctx.lineTo(238, 236);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '900 70px "Trebuchet MS", sans-serif';
      ctx.fillText('P', 256, 130);
    }
  });
}

export function makeNeonSignTexture(text, color = '#ff7fae', vertical = false) {
  const width = vertical ? 256 : 768;
  const height = vertical ? 768 : 256;
  return makeCanvasTexture(width, height, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(10,14,22,0.9)';
    roundRect(ctx, 6, 6, w - 12, h - 12, 22);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    roundRect(ctx, 16, 16, w - 32, h - 32, 16);
    ctx.stroke();
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 24;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (vertical) {
      ctx.font = japaneseFont(140, 800);
      [...text].forEach((ch, i) => {
        ctx.fillText(ch, w / 2, 120 + i * 150);
      });
    } else {
      ctx.font = japaneseFont(150, 800);
      ctx.fillText(text, w / 2, h / 2 + 6);
    }
    ctx.restore();
  });
}

/* ------------------------------------------------------------------ *
 *  Ground decals / effects
 * ------------------------------------------------------------------ */

export function makeManholeTexture() {
  return makeCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.fillStyle = '#333c48';
    ctx.beginPath();
    ctx.arc(0, 0, 230, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6b7788';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 216, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#505b69';
    ctx.lineWidth = 5;
    for (let r = 60; r < 200; r += 40) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 80, Math.sin(a) * 80);
      ctx.lineTo(Math.cos(a) * 196, Math.sin(a) * 196);
      ctx.stroke();
    }
    ctx.fillStyle = '#758293';
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a4451';
    ctx.font = '700 28px "Yu Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('星野町', 0, 88);
    ctx.restore();
  });
}

export function makeBasePlateTexture() {
  return makeCanvasTexture(1024, 160, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#b39258');
    g.addColorStop(0.45, '#e1c88e');
    g.addColorStop(0.6, '#c7a568');
    g.addColorStop(1, '#8d6d3c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(60,40,16,0.55)';
    ctx.lineWidth = 5;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#3a2a14';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 44px "Trebuchet MS", sans-serif';
    ctx.fillText('H O S H I Z O R A   M A R T', w / 2, 58);
    ctx.font = japaneseFont(26, 600);
    ctx.fillText('雨の街角 ・ 夜のミニチュア', w / 2, 104);
    ctx.font = '600 18px "Trebuchet MS", sans-serif';
    ctx.fillText('RAINY CORNER   /   1 : 24   /   HANDCRAFTED SCENE', w / 2, 138);
  });
}

export function makeRainGlassTexture() {
  return makeCanvasTexture(
    512,
    1024,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      // sparse vertical runnels
      for (let i = 0; i < 38; i++) {
        const x = Math.random() * w;
        const y0 = Math.random() * h;
        const len = 40 + Math.random() * 250;
        const grad = ctx.createLinearGradient(0, y0, 0, y0 + len);
        grad.addColorStop(0, 'rgba(220,240,255,0)');
        grad.addColorStop(0.35, `rgba(220,240,255,${0.05 + Math.random() * 0.14})`);
        grad.addColorStop(1, 'rgba(220,240,255,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1 + Math.random() * 2.4;
        ctx.beginPath();
        ctx.moveTo(x, y0);
        ctx.lineTo(x + (Math.random() - 0.5) * 10, y0 + len);
        ctx.stroke();
        // bead at the head of the runnel
        ctx.fillStyle = `rgba(230,248,255,${0.18 + Math.random() * 0.25})`;
        ctx.beginPath();
        ctx.arc(x, y0 + len, 1.5 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // static beads
      for (let i = 0; i < 180; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = Math.random() * 2.8 + 0.6;
        ctx.fillStyle = `rgba(210,235,255,${0.06 + Math.random() * 0.16})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    { repeat: [2, 2] }
  );
}

export function makeReflectionStreakTexture() {
  return makeCanvasTexture(256, 1024, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const base = ctx.createLinearGradient(0, 0, 0, h);
    base.addColorStop(0, 'rgba(255,255,255,0)');
    base.addColorStop(0.15, 'rgba(255,255,255,0.18)');
    base.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    base.addColorStop(0.78, 'rgba(255,255,255,0.16)');
    base.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    // uneven bright ribbons
    for (let i = 0; i < 7; i++) {
      const x = 20 + Math.random() * (w - 40);
      const ww = 4 + Math.random() * 18;
      const g = ctx.createLinearGradient(x, 0, x + ww, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, `rgba(255,255,255,${0.12 + Math.random() * 0.2})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, h * 0.18, ww, h * 0.64);
    }
    // horizontal water breakup bands
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 22; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.25})`;
      ctx.fillRect(0, Math.random() * h, w, 1 + Math.random() * 6);
    }
    ctx.globalCompositeOperation = 'source-over';
  });
}

export function makeRadialGlowTexture(inner = 'rgba(255,240,210,0.95)', outer = 'rgba(255,240,210,0)') {
  return makeCanvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, inner);
    g.addColorStop(0.32, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

export function makeSoftCloudTexture() {
  return makeCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 42; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = 30 + Math.random() * 120;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(190,215,245,${0.03 + Math.random() * 0.06})`);
      g.addColorStop(1, 'rgba(190,215,245,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
}

export function makeConeTexture() {
  return makeCanvasTexture(
    128,
    512,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(255,220,165,0.9)');
      g.addColorStop(0.25, 'rgba(255,220,165,0.4)');
      g.addColorStop(1, 'rgba(255,220,165,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 4) {
        ctx.fillStyle = `rgba(255,230,190,${Math.random() * 0.05})`;
        ctx.fillRect(x, 0, 2, h);
      }
    },
    { repeat: [1, 1] }
  );
}

export function makeWindowGlowTexture(color) {
  return makeCanvasTexture(128, 128, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(15,20,28,0.12)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(20,24,32,0.85)';
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, w, h);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
  });
}

export function makePosterPlaceholderTexture(accent = '#ff8c5c') {
  return makeCanvasTexture(256, 360, (ctx, w, h) => {
    ctx.fillStyle = '#f6f0df';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, w, 82);
    ctx.fillStyle = '#fff8ea';
    ctx.textAlign = 'center';
    ctx.font = japaneseFont(34, 800);
    ctx.fillText('おすすめ', w / 2, 54);
    ctx.fillStyle = '#29394a';
    ctx.font = japaneseFont(28, 700);
    ctx.fillText('新商品', w / 2, 132);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(w / 2, 226, 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f6f0df';
    ctx.beginPath();
    ctx.arc(w / 2, 226, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2e22';
    ctx.font = japaneseFont(18, 600);
    ctx.fillText('期間限定', w / 2, 320);
  });
}