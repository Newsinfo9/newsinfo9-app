// Builds a branded NEWS INFO9 story card (PNG) in the browser for WhatsApp / share.
// Layout (1080 x 1350): brand header · full photo (never cropped) · title · news · footer with app name + link.
const W = 1080, H = 1350;
const BLUE = "#0a6cc4", DEEP = "#0657a8", TEAL = "#03cdbf";
const FONT = '"Noto Sans Telugu", "Inter", system-ui, sans-serif';

function loadImg(src, cors) {
  return new Promise(res => {
    if (!src) return res(null);
    const im = new Image();
    if (cors) im.crossOrigin = "anonymous";
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = src;
  });
}

function wrap(ctx, text, maxW, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = []; let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line); line = w;
      if (lines.length === maxLines) break;
    } else line = test;
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    let last = lines[maxLines - 1];
    while (ctx.measureText(last + "…").width > maxW && last.length) last = last.slice(0, -1);
    lines[maxLines - 1] = last + "…";
  }
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

export async function makeShareCard({ title, body, image, category, source, place, time, appLine, site }) {
  try { await document.fonts.ready; } catch {}
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  const [logo, photo] = await Promise.all([loadImg("/logo-round.png"), loadImg(image, true)]);

  // Background
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);

  // Header brand bar
  const g = ctx.createLinearGradient(0, 0, W, 140);
  g.addColorStop(0, TEAL); g.addColorStop(0.45, "#0a8fd6"); g.addColorStop(1, DEEP);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 140);
  if (logo) { ctx.save(); roundRect(ctx, 40, 30, 80, 80, 20); ctx.clip(); ctx.drawImage(logo, 40, 30, 80, 80); ctx.restore(); }
  ctx.fillStyle = "#fff"; ctx.font = `italic 800 54px Inter, ${FONT}`; ctx.textBaseline = "middle";
  ctx.fillText("NEWS INFO", 140, 72);
  const nw = ctx.measureText("NEWS INFO").width;
  ctx.fillStyle = "#e8ff3a"; ctx.font = `800 34px Inter, sans-serif`; ctx.fillText("9", 140 + nw + 4, 56);
  if (category) {
    ctx.font = `700 30px ${FONT}`;
    const tw = ctx.measureText(category).width + 44;
    ctx.fillStyle = "rgba(255,255,255,.22)"; roundRect(ctx, W - 40 - tw, 46, tw, 52, 26); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillText(category, W - 40 - tw + 22, 73);
  }

  // Photo area – whole photo visible (contain) on a blurred fill
  const PY = 140, PH = 560;
  let drewPhoto = false;
  if (photo) {
    try {
      ctx.save();
      ctx.beginPath(); ctx.rect(0, PY, W, PH); ctx.clip();          // keep blur inside the photo area
      ctx.fillStyle = "#0b2a4a"; ctx.fillRect(0, PY, W, PH);
      ctx.filter = "blur(28px) brightness(.8)";
      const s1 = Math.max(W / photo.width, PH / photo.height) * 1.15;
      ctx.drawImage(photo, (W - photo.width * s1) / 2, PY + (PH - photo.height * s1) / 2, photo.width * s1, photo.height * s1);
      ctx.filter = "none";
      const s2 = Math.min(W / photo.width, PH / photo.height);
      ctx.drawImage(photo, (W - photo.width * s2) / 2, PY + (PH - photo.height * s2) / 2, photo.width * s2, photo.height * s2);
      ctx.restore();
      c.toDataURL(); // throws if the photo blocked cross-origin use
      drewPhoto = true;
    } catch { drewPhoto = false; }
  }
  if (!drewPhoto) {
    const g2 = ctx.createLinearGradient(0, PY, W, PY + PH);
    g2.addColorStop(0, "#0a8fd6"); g2.addColorStop(1, DEEP);
    ctx.filter = "none"; ctx.fillStyle = g2; ctx.fillRect(0, PY, W, PH);
    if (logo) { ctx.save(); roundRect(ctx, W / 2 - 110, PY + PH / 2 - 130, 220, 220, 50); ctx.clip(); ctx.drawImage(logo, W / 2 - 110, PY + PH / 2 - 130, 220, 220); ctx.restore(); }
  }
  // small logo watermark on photo
  if (logo && drewPhoto) { ctx.globalAlpha = .9; ctx.save(); roundRect(ctx, W - 100, PY + PH - 100, 72, 72, 16); ctx.clip(); ctx.drawImage(logo, W - 100, PY + PH - 100, 72, 72); ctx.restore(); ctx.globalAlpha = 1; }

  // Title + body
  let y = PY + PH + 50;
  ctx.textBaseline = "top"; ctx.fillStyle = "#15181d"; ctx.font = `700 50px ${FONT}`;
  for (const l of wrap(ctx, title, W - 100, 3)) { ctx.fillText(l, 50, y); y += 72; }
  y += 10;
  ctx.fillStyle = "#3b4350"; ctx.font = `400 36px ${FONT}`;
  const bodyLines = Math.max(2, Math.floor((H - 150 - y) / 56));
  for (const l of wrap(ctx, body, W - 100, bodyLines)) { ctx.fillText(l, 50, y); y += 56; }

  // Footer
  ctx.fillStyle = "#eef2f6"; ctx.fillRect(0, H - 120, W, 120);
  ctx.fillStyle = BLUE; ctx.fillRect(0, H - 120, W, 4);
  ctx.textBaseline = "middle"; ctx.fillStyle = "#6b7280"; ctx.font = `500 28px ${FONT}`;
  const metaLine = [source, place, time].filter(Boolean).join("  ·  ");
  ctx.fillText(metaLine, 50, H - 86);
  ctx.fillStyle = BLUE; ctx.font = `700 30px ${FONT}`;
  ctx.fillText(`${appLine}  •  ${site}`, 50, H - 42);

  return new Promise(res => c.toBlob(b => res(b), "image/png", 0.92));
}
