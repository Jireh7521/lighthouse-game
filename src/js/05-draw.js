// ---------------------------------------------------------------- drawing helpers
var cam = 0;
function limb(x1, y1, x2, y2, w, col) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function rrect(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
function ell(x, y, rx, ry, col, rot) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); ctx.fill(); }

function drawPalm(x, base, h, c) {
  var tx = x + h * 0.16, ty = base - h;
  var wb = h * 0.05 + 2, wt = h * 0.028 + 1.1;
  ctx.beginPath();
  ctx.moveTo(x - wb, base + 3);
  ctx.quadraticCurveTo(x + h * 0.03 - wt, base - h * 0.55, tx - wt, ty);
  ctx.lineTo(tx + wt, ty);
  ctx.quadraticCurveTo(x + h * 0.10 + wt, base - h * 0.55, x + wb, base + 3);
  ctx.closePath();
  var tg = ctx.createLinearGradient(x - wb, 0, x + wb, 0);
  tg.addColorStop(0, tint(c, -0.42)); tg.addColorStop(0.5, tint(c, -0.12)); tg.addColorStop(1, tint(c, 0.26));
  ctx.fillStyle = tg; ctx.fill();
  ctx.strokeStyle = tint(c, -0.5); ctx.lineWidth = 1; ctx.globalAlpha = 0.45;
  for (var r = 1; r < 7; r++) {
    var tt = r / 7, rx = x + (tx - x) * tt * tt, ry = base - h * tt, rw = wb * (1 - tt * 0.45);
    ctx.beginPath(); ctx.moveTo(rx - rw, ry); ctx.lineTo(rx + rw, ry); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (var pass = 0; pass < 2; pass++) {
    ctx.fillStyle = pass ? tint(c, 0.2) : tint(c, -0.2);
    for (var k = 0; k < 8; k++) {
      var a = -Math.PI * 0.98 + (k * Math.PI) / 6.4 + (pass ? 0.06 : 0);
      var len = h * (0.42 + 0.07 * Math.sin(k * 2.1));
      var ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.55 + h * 0.08;
      var mx = tx + Math.cos(a) * len * 0.55, my = ty + Math.sin(a) * len * 0.3 - h * 0.14;
      var wd = h * 0.05 * (pass ? 0.7 : 1);
      ctx.beginPath(); ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(mx, my - wd, ex, ey);
      ctx.quadraticCurveTo(mx, my + wd, tx, ty);
      ctx.fill();
    }
  }
}
function drawBroad(x, base, h, c) {
  var tw = h * 0.042, ty = base - h * 0.62;
  var tg = ctx.createLinearGradient(x - tw, 0, x + tw, 0);
  tg.addColorStop(0, tint(c, -0.5)); tg.addColorStop(0.55, tint(c, -0.14)); tg.addColorStop(1, tint(c, 0.22));
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.moveTo(x - tw, base + 3); ctx.quadraticCurveTo(x - tw * 0.7, (base + ty) / 2, x - tw * 0.8, ty);
  ctx.lineTo(x + tw * 0.8, ty); ctx.quadraticCurveTo(x + tw * 0.7, (base + ty) / 2, x + tw, base + 3);
  ctx.closePath(); ctx.fill();
  var cl = [[0, -0.8, 0.31, 0.21], [-0.21, -0.67, 0.22, 0.15], [0.22, -0.69, 0.24, 0.16], [-0.1, -0.92, 0.19, 0.14], [0.13, -0.94, 0.17, 0.13]];
  ctx.fillStyle = tint(c, -0.34);
  for (var i = 0; i < cl.length; i++) ell(x + cl[i][0] * h, base + cl[i][1] * h, cl[i][2] * h, cl[i][3] * h, tint(c, -0.34));
  ctx.fillStyle = tint(c, -0.1);
  for (var j = 0; j < cl.length; j++) ell(x + cl[j][0] * h - h * 0.025, base + cl[j][1] * h - h * 0.03, cl[j][2] * h * 0.76, cl[j][3] * h * 0.72, tint(c, -0.1));
  ctx.fillStyle = tint(c, 0.2);
  for (var k = 0; k < 3; k++) ell(x + cl[k][0] * h - h * 0.05, base + cl[k][1] * h - h * 0.05, cl[k][2] * h * 0.4, cl[k][3] * h * 0.36, tint(c, 0.2));
  ctx.strokeStyle = tint(c, 0.06); ctx.lineWidth = 1.3;
  for (var v = -1; v <= 1; v++) { ctx.beginPath(); ctx.moveTo(x + v * h * 0.17, base - h * 0.62); ctx.quadraticCurveTo(x + v * h * 0.17 + 3, base - h * 0.42, x + v * h * 0.17 - 2, base - h * 0.27 - rnd(v + h) * 10); ctx.stroke(); }
}
function treeLayer(f, tile, hBase, colKey, seed, th) {
  if (th.dens <= 0.01) return;
  var off = cam * f, i0 = Math.floor(off / tile) - 1, i1 = Math.floor((off + VW) / tile) + 1;
  for (var i = i0; i <= i1; i++) {
    if (rnd(i * 7 + seed) > th.dens) continue;
    var sx = i * tile - off + rnd(i + seed) * tile * 0.7;
    var h = hBase * (0.75 + rnd(i * 3 + seed) * 0.6);
    var c = th[colKey];
    if (!gfxLite && f > 0.45) { var sd = softDotSprite(), sr = h * 0.36; ctx.drawImage(sd, sx - sr, GROUND + 4 - sr * 0.24, sr * 2, sr * 0.48); }
    if (th.palm > 0.5) drawPalm(sx, GROUND + 4, h, c); else drawBroad(sx, GROUND + 6, h * 1.25, c);
  }
}

function drawSky(th, cave) {
  var g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, rgb(th.skyT));
  g.addColorStop(0.56, rgb(mixc(th.skyT, th.skyB, 0.62)));
  g.addColorStop(1, rgb(th.skyB));
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, H);
  // soft cloud banks drifting above the horizon
  if (!gfxLite && cave < 0.98 && th.dens < 0.9) {
    var cc = mixc(th.skyB, [255, 255, 255], th.sun > 0.4 ? 0.4 : 0.16);
    var cg2 = ctx.createRadialGradient(0, 0, 0.12, 0, 0, 1);
    cg2.addColorStop(0, rgb(cc, 0.2)); cg2.addColorStop(0.55, rgb(cc, 0.08)); cg2.addColorStop(1, rgb(cc, 0));
    ctx.fillStyle = cg2;
    for (var ci = 0; ci < 4; ci++) {
      var cw = 55 + rnd(ci * 3.7) * 70;
      var cxp = ((ci * 280 + 40 - cam * 0.05 - S.t * 3) % (VW + 320) + VW + 320) % (VW + 320) - 160;
      var cyp = 30 + rnd(ci * 5.1) * 86;
      ctx.save(); ctx.translate(cxp, cyp); ctx.scale(cw, cw * 0.7); ctx.fillRect(-1, -1, 2, 2); ctx.restore();
    }
  }
  if (th.stars > 0.02 && cave < 1) {
    ctx.fillStyle = '#fff';
    for (var i = 0; i < 46; i++) {
      var sx = ((rnd(i) * 900 - cam * 0.03) % 900 + 900) % 900, sy = rnd(i + 99) * 150;
      if (sx > VW) continue;
      ctx.globalAlpha = th.stars * (0.35 + 0.5 * Math.abs(Math.sin(S.t * 1.5 + i)));
      ctx.fillRect(sx, sy, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;
  }
  if (th.moon > 0.02) {
    var mx = VW * 0.2 - cam * 0.01;
    var mg = ctx.createRadialGradient(mx, 56, 10, mx, 56, 46);
    mg.addColorStop(0, 'rgba(238,242,216,' + th.moon * 0.35 + ')'); mg.addColorStop(1, 'rgba(238,242,216,0)');
    ctx.fillStyle = mg; ctx.fillRect(mx - 50, 6, 100, 100);
    ctx.globalAlpha = th.moon * 0.92; ell(mx, 56, 16, 16, '#eef2d8'); ctx.globalAlpha = 1;
  }
  if (th.sun > 0.02) {
    var sx2 = VW * 0.72 - cam * 0.02;
    var sg = ctx.createRadialGradient(sx2, 190, 4, sx2, 190, 120);
    sg.addColorStop(0, 'rgba(255,224,160,' + th.sun * 0.95 + ')'); sg.addColorStop(1, 'rgba(255,170,100,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 60, VW, 260);
    ell(sx2, 190, 22, 22, 'rgba(255,238,190,' + th.sun + ')');
  }
}
function drawFar(th) {
  var off = cam * 0.12;
  ctx.fillStyle = rgb(th.far);
  ctx.beginPath(); ctx.moveTo(0, GROUND);
  for (var x = 0; x <= VW + 20; x += 20) {
    var wx = x + off;
    ctx.lineTo(x, GROUND - 52 - 26 * Math.sin(wx * 0.006) - 18 * Math.sin(wx * 0.017 + 2) - 8 * Math.sin(wx * 0.041));
  }
  ctx.lineTo(VW + 20, GROUND); ctx.closePath(); ctx.fill();
}
function drawSea(th) {
  if (th.sea < 0.02) return;
  ctx.globalAlpha = th.sea;
  var g = ctx.createLinearGradient(0, 186, 0, GROUND);
  g.addColorStop(0, rgb(mixc(th.skyB, th.skyT, 0.35))); g.addColorStop(1, rgb(mixc(th.skyT, [0, 0, 0], 0.25)));
  ctx.fillStyle = g; ctx.fillRect(0, 196, VW, GROUND - 196);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.4;
  for (var i = 0; i < 9; i++) {
    var y = 206 + i * 9, x = ((i * 91 + S.t * (10 + i * 2) - cam * 0.2) % (VW + 80)) - 40;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 14, y - 3, x + 28, y); ctx.stroke();
  }
  // the sky lying on the water, and glitter under the sun
  var rg = ctx.createLinearGradient(0, 196, 0, GROUND);
  rg.addColorStop(0, rgb(mixc(th.skyB, [255, 240, 200], 0.45), 0.26));
  rg.addColorStop(1, rgb(mixc(th.skyT, [255, 255, 255], 0.2), 0.04));
  ctx.fillStyle = rg; ctx.fillRect(0, 196, VW, GROUND - 196);
  for (var s2 = 0; s2 < 24; s2++) {
    var gx2 = ((s2 * 137 + S.t * (12 + (s2 % 5) * 6)) % (VW + 60)) - 30;
    var gy2 = 202 + rnd(s2 * 4.1) * (GROUND - 208);
    ctx.globalAlpha = th.sea * (0.1 + 0.22 * Math.abs(Math.sin(S.t * 1.6 + s2)));
    ctx.fillStyle = '#fff'; ctx.fillRect(gx2, gy2, 5 + rnd(s2) * 10, 1.2);
  }
  ctx.globalAlpha = 1;
}
function drawDistantTower(th) {
  var k = 0.55 + (cam / WORLD) * 1.1;
  var x = VW * 0.8 - cam * 0.02;
  ctx.save(); ctx.translate(x, GROUND - 40); ctx.scale(k, k);
  ctx.fillStyle = rgb(mixc(th.far, [0, 0, 0], 0.3));
  ctx.beginPath(); ctx.moveTo(-12, 40); ctx.lineTo(-8, -60); ctx.lineTo(8, -60); ctx.lineTo(12, 40); ctx.closePath(); ctx.fill();
  ctx.fillRect(-11, -68, 22, 8); ctx.fillRect(-6, -80, 12, 12);
  ctx.beginPath(); ctx.moveTo(-8, -80); ctx.lineTo(0, -90); ctx.lineTo(8, -80); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawCaveWall(cave) {
  if (cave < 0.01) return;
  ctx.globalAlpha = cave;
  var g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2b1d78'); g.addColorStop(1, '#4b38a8');
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, H);
  var off = cam * 0.4;
  ctx.fillStyle = '#33248c';
  for (var i = Math.floor(off / 90) - 1; i < (off + VW) / 90 + 1; i++) {
    var sx = i * 90 - off, r = rnd(i * 5 + 3);
    ell(sx + 40, 120 + r * 120, 60 + r * 40, 50 + r * 30, '#3d2c9c');
  }
  ctx.fillStyle = '#241a5e';
  var off2 = cam * 0.7;
  for (var j = Math.floor(off2 / 70) - 1; j < (off2 + VW) / 70 + 1; j++) {
    var x = j * 70 - off2, hh = 26 + rnd(j * 11 + 1) * 70;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 38, 0); ctx.lineTo(x + 19, hh); ctx.closePath(); ctx.fill();
  }
  // crystals
  for (var c = 0; c < 10; c++) {
    var cx = ((c * 173 + 40 - cam * 0.55) % (VW + 160) + VW + 160) % (VW + 160) - 40, cy = 90 + rnd(c * 13) * 160;
    var cc2 = (c % 2 ? '255,130,230,' : '110,215,255,');
    var gl = ctx.createRadialGradient(cx + 5, cy - 6, 0.5, cx + 5, cy - 6, 19);
    gl.addColorStop(0, 'rgba(' + cc2 + (0.3 + 0.16 * Math.sin(S.t * 2 + c)) + ')');
    gl.addColorStop(1, 'rgba(' + cc2 + '0)');
    ctx.fillStyle = gl; ctx.fillRect(cx - 15, cy - 26, 40, 40);
    ctx.fillStyle = 'rgba(' + cc2 + (0.5 + 0.3 * Math.sin(S.t * 2 + c)) + ')';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 5, cy - 14); ctx.lineTo(cx + 10, cy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,' + (0.22 + 0.16 * Math.sin(S.t * 2 + c)) + ')';
    ctx.beginPath(); ctx.moveTo(cx + 4, cy - 1); ctx.lineTo(cx + 5, cy - 13); ctx.lineTo(cx + 7, cy - 1); ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawGround(th) {
  var gg = ctx.createLinearGradient(0, GROUND, 0, H);
  gg.addColorStop(0, rgb(th.gB)); gg.addColorStop(1, rgb(mixc(th.gB, [0, 0, 0], 0.65)));
  ctx.fillStyle = gg; ctx.fillRect(0, GROUND, VW, H - GROUND);
  // the surface itself: a photo of real sand, soil, rock or planks, tiled and darkened with depth
  var gtex = groundTexAt(zoneIndex(cam + VW / 2));
  if (gtex) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, GROUND, VW, H - GROUND); ctx.clip();
    var TW = 384, TH = 52, gx = -((cam * 1.0) % TW);
    for (var tx = gx - TW; tx < VW + TW; tx += TW) ctx.drawImage(gtex, tx, GROUND, TW, TH);
    var dg2 = ctx.createLinearGradient(0, GROUND, 0, H);
    dg2.addColorStop(0, 'rgba(0,0,0,0.10)'); dg2.addColorStop(0.5, 'rgba(0,0,0,0.40)'); dg2.addColorStop(1, 'rgba(0,0,0,0.78)');
    ctx.fillStyle = dg2; ctx.fillRect(0, GROUND, VW, H - GROUND);
    ctx.restore();
  }
  // sediment layers and grit
  ctx.save();
  ctx.beginPath(); ctx.rect(0, GROUND, VW, H - GROUND); ctx.clip();
  for (var li = 1; li <= 3; li++) {
    var ly = GROUND + li * 10 + 3;
    ctx.strokeStyle = li % 2 ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.055)';
    ctx.lineWidth = li === 1 ? 2.2 : 1.2;
    ctx.beginPath();
    for (var lx = 0; lx <= VW; lx += 20) {
      var wy = ly + Math.sin((lx + cam) * 0.028 + li) * 1.8 + Math.sin((lx + cam) * 0.011 + li * 2) * 1.2;
      if (lx === 0) ctx.moveTo(lx, wy); else ctx.lineTo(lx, wy);
    }
    ctx.stroke();
  }
  for (var gi = 0; gi < (gfxLite ? 32 : 72); gi++) {
    var qx = (gi * 79 + 13) % VW, qy = GROUND + 6 + ((gi * 41) % Math.max(10, H - GROUND - 8));
    var qr = rnd(gi * 2.3);
    ctx.fillStyle = qr > 0.62 ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.11)';
    ctx.fillRect(qx, qy, 1 + qr * 2.6, 1 + qr);
  }
  ctx.restore();
  // pits and chasm
  var holes = PITS.map(function (p) { return { x: p.x, w: p.w }; });
  holes.push({ x: CHASM.x + CHASM.w * S.bridgeT, w: CHASM.w * (1 - S.bridgeT) });
  holes.forEach(function (h) {
    var sx = h.x - cam;
    if (sx > VW + 4 || sx + h.w < -4 || h.w <= 0) return;
    var g = ctx.createLinearGradient(0, GROUND, 0, H);
    g.addColorStop(0, '#05080a'); g.addColorStop(1, '#000');
    ctx.fillStyle = g; ctx.fillRect(sx, GROUND - 2, h.w, H - GROUND + 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(sx - 4, GROUND, 4, H - GROUND); ctx.fillRect(sx + h.w, GROUND, 4, H - GROUND);
  });
  // top strip
  ctx.fillStyle = rgb(th.gT);
  var x0 = Math.floor(cam / 14) * 14;
  ctx.fillRect(0, GROUND, VW, 7);
  ctx.fillStyle = rgb(mixc(th.gT, [255, 255, 255], 0.12));
  ctx.fillRect(0, GROUND, VW, 2);
  for (var x = x0; x < cam + VW + 14; x += 14) {
    var r = rnd(x * 0.31);
    var sx = x - cam;
    if (r < th.grass) {
      ctx.strokeStyle = rgb(mixc(th.gT, [20, 80, 30], 0.35 * r)); ctx.lineWidth = 1.6;
      for (var b = 0; b < 3; b++) { ctx.beginPath(); ctx.moveTo(sx + b * 3, GROUND + 1); ctx.lineTo(sx + b * 3 + (b - 1) * 3, GROUND - 6 - r * 10); ctx.stroke(); }
    } else if (r > 0.85) { ell(sx, GROUND + 12 + r * 6, 3 + r * 4, 2, rgb(mixc(th.gB, [0, 0, 0], 0.3))); }
  }
  // cover the strip over pits
  holes.forEach(function (h) {
    var sx = h.x - cam;
    if (sx > VW || sx + h.w < 0 || h.w <= 0) return;
    ctx.fillStyle = '#05080a'; ctx.fillRect(sx, GROUND - 8, h.w, 18);
  });
}
function drawObstacles(th) {
  var i, ph = tidePhase();
  // tide: wet sand shows where the water reaches; it surges in on a timer
  TIDES.forEach(function (t) {
    var x = t.x - cam; if (x > VW || x + t.w < 0) return;
    var lvl = ph > 5.2 ? (ph < 5.45 ? sm((ph - 5.2) / 0.25) : (ph > 6.5 ? 1 - sm((ph - 6.5) / 0.5) : 1)) : 0;
    ctx.fillStyle = 'rgba(40,70,90,0.18)'; ctx.fillRect(x, GROUND, t.w, 4);
    var h = lvl * 30 + (ph > 4.2 && ph <= 5.2 ? 3 + Math.sin(S.t * 9) * 1.5 : 0);
    if (h > 0.5) {
      var g = ctx.createLinearGradient(0, GROUND - h, 0, GROUND); g.addColorStop(0, 'rgba(120,225,255,0.8)'); g.addColorStop(1, 'rgba(40,120,220,0.65)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, GROUND);
      for (var wx = 0; wx <= t.w; wx += 10) ctx.lineTo(x + wx, GROUND - h + Math.sin(wx * 0.12 + S.t * 6) * 2.5);
      ctx.lineTo(x + t.w, GROUND); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; ctx.beginPath();
      for (var fx = 0; fx <= t.w; fx += 10) { var fy = GROUND - h + Math.sin(fx * 0.12 + S.t * 6) * 2.5; if (fx === 0) ctx.moveTo(x + fx, fy); else ctx.lineTo(x + fx, fy); } ctx.stroke();
    }
  });
  S.obst.forEach(function (o) {
    var x = o.x - cam; if (x < -90 || x > VW + 90) return;
    if (o.k === 'rock') {
      var w = o.w, h = o.h;
      shadowAt(o.x, GROUND, w * 0.8, 0.35);
      var g = ctx.createLinearGradient(x - w / 2, GROUND - h, x + w / 2, GROUND); g.addColorStop(0, '#a6acb1'); g.addColorStop(1, '#4a5157');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w / 2, GROUND + 1);
      ctx.quadraticCurveTo(x - w / 2 - 3, GROUND - h * 0.7, x - w * 0.22, GROUND - h);
      ctx.quadraticCurveTo(x + w * 0.1, GROUND - h - 5, x + w * 0.34, GROUND - h * 0.84);
      ctx.quadraticCurveTo(x + w / 2 + 4, GROUND - h * 0.4, x + w / 2, GROUND + 1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - w * 0.3, GROUND - h * 0.8); ctx.quadraticCurveTo(x - w * 0.05, GROUND - h * 0.98, x + w * 0.2, GROUND - h * 0.86); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.moveTo(x - 2, GROUND - h * 0.7); ctx.lineTo(x + 3, GROUND - h * 0.35); ctx.stroke();
    } else if (o.k === 'thorn') {
      var tw = o.w;
      ctx.fillStyle = '#1d3a22'; ctx.beginPath(); ctx.ellipse(x, GROUND - 4, tw / 2, 8, 0, Math.PI, 0); ctx.fill();
      for (var k = 0; k < 9; k++) {
        var tx = x - tw / 2 + 3 + k * ((tw - 6) / 8), th2 = 12 + (k % 3) * 5 + rnd(o.x + k) * 4, lean = (k - 4) * 1.2;
        ctx.fillStyle = k % 2 ? '#2f5a2c' : '#3a6b32'; ctx.beginPath(); ctx.moveTo(tx - 3, GROUND); ctx.lineTo(tx + lean, GROUND - th2); ctx.lineTo(tx + 3, GROUND); ctx.fill();
        ctx.fillStyle = '#c4452f'; ctx.beginPath(); ctx.arc(tx + lean, GROUND - th2, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    } else if (o.k === 'mud') {
      var g2 = ctx.createLinearGradient(0, GROUND - 2, 0, GROUND + 7); g2.addColorStop(0, '#6b4a2b'); g2.addColorStop(1, '#2f1f12');
      ctx.fillStyle = g2; rrect(x - o.w / 2, GROUND - 2, o.w, 9, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,220,170,0.25)'; ctx.fillRect(x - o.w / 2 + 6, GROUND - 1, o.w - 12, 1.5);
      for (var b = 0; b < 4; b++) { var bp = (S.t * 0.6 + b * 0.27 + o.x) % 1; ctx.strokeStyle = 'rgba(255,220,170,' + (0.5 * (1 - bp)) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x - o.w / 2 + 14 + b * (o.w - 28) / 3, GROUND + 2 - bp * 3, 1 + bp * 2, 0, Math.PI * 2); ctx.stroke(); }
    }
  });
}
function drawHazards() {
  var i;
  // ground markers for rocks about to fall
  S.falls.forEach(function (f) {
    var x = f.x - cam;
    if (f.state === 'warn') {
      var a = 0.25 + 0.3 * Math.abs(Math.sin(S.t * 16));
      ctx.save(); ctx.translate(x, GROUND); ctx.scale(1, 0.22);
      ctx.fillStyle = 'rgba(255,90,60,' + a + ')'; ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.strokeStyle = 'rgba(255,200,170,' + (a * 1.2) + ')'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(x, 6); ctx.lineTo(x, GROUND - 6); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#6b737a'; ctx.beginPath(); ctx.moveTo(x - 9 + Math.sin(S.t * 40) * 1, 0); ctx.lineTo(x + 9, 0); ctx.lineTo(x, 24); ctx.fill();
    } else {
      ctx.fillStyle = '#80888f'; ctx.beginPath(); ctx.moveTo(x - 9, f.y - 30); ctx.lineTo(x + 9, f.y - 30); ctx.lineTo(x + 1, f.y + 4); ctx.lineTo(x - 2, f.y + 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(x - 5, f.y - 30, 3, 26);
    }
  });
  // rolling boulders
  S.boulders.forEach(function (b) {
    var x = b.x - cam; if (x < -40 || x > VW + 40) return;
    shadowAt(b.x, GROUND, 20, 0.4);
    ctx.save(); ctx.translate(x, GROUND - 16); ctx.rotate(-b.rot);
    var g = ctx.createRadialGradient(-5, -6, 2, 0, 0, 17); g.addColorStop(0, '#b4a78a'); g.addColorStop(1, '#5a5040');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(30,22,12,0.5)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(-2, 3); ctx.lineTo(6, -5); ctx.moveTo(2, 3); ctx.lineTo(4, 12); ctx.stroke();
    ctx.restore();
  });
  // lightning: red ring warns, then the bolt
  S.bolts.forEach(function (b) {
    var x = b.x - cam;
    if (b.t < 0.9) {
      var a = 0.25 + 0.4 * (b.t / 0.9), pul = 0.6 + 0.4 * Math.abs(Math.sin(S.t * 18));
      ctx.save(); ctx.translate(x, GROUND); ctx.scale(1, 0.24);
      ctx.strokeStyle = 'rgba(255,90,70,' + (a * pul + 0.2) + ')'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 28 - 10 * (b.t / 0.9), 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,90,70,' + (a * 0.5) + ')'; ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    } else {
      var fa = 1 - (b.t - 0.9) / 0.4;
      ctx.strokeStyle = 'rgba(235,240,255,' + fa + ')'; ctx.lineWidth = 3; ctx.shadowColor = '#bcd0ff'; ctx.shadowBlur = 12;
      ctx.beginPath(); var yy = 0, xx = x + 6; ctx.moveTo(xx, yy);
      while (yy < GROUND) { yy += 22 + rnd(b.x + yy) * 14; xx = x + (rnd(b.x * 3 + yy) - 0.5) * 30 * (1 - yy / GROUND); ctx.lineTo(xx, Math.min(yy, GROUND)); }
      ctx.stroke(); ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,' + fa * 0.5 + ')'; ctx.beginPath(); ctx.arc(x, GROUND - 4, 22 * fa + 6, 0, Math.PI * 2); ctx.fill();
    }
  });
  // wind streaks
  var wl = S.bridgeGrow && S.p.x > 5100 && S.p.x < 6150 ? windLevel() : 0, ww = S.bridgeGrow && S.p.x > 5100 && S.p.x < 6150 && windWarn();
  if (wl > 0.02 || ww) {
    var amt = wl > 0.02 ? wl : 0.25;
    ctx.strokeStyle = 'rgba(220,235,245,' + 0.28 * amt + ')'; ctx.lineWidth = 1.2; ctx.beginPath();
    for (i = 0; i < 26; i++) {
      var sp = 700 + rnd(i) * 500, yy2 = 30 + rnd(i * 3 + 1) * (GROUND - 40), xx2 = VW + 60 - ((S.t * sp + i * 97) % (VW + 160));
      ctx.moveTo(xx2, yy2); ctx.lineTo(xx2 + 40 + rnd(i + 5) * 40, yy2 + 2);
    }
    ctx.stroke();
  }
}
function drawPlatforms(th) {
  PLATS.forEach(function (pl) {
    var sx = pl.x - cam;
    if (sx > VW + 10 || sx + pl.w < -10) return;
    // soft contact shadow so the ledge sits in the painting
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath();
    ctx.ellipse(sx + pl.w / 2, pl.y + 20, pl.w * 0.56, 6, 0, 0, Math.PI * 2); ctx.fill();
    // body: warm light on top, cool weight underneath
    var bg = ctx.createLinearGradient(0, pl.y, 0, pl.y + 18);
    bg.addColorStop(0, rgb(th.gT)); bg.addColorStop(0.45, rgb(mixc(th.gB, th.gT, 0.35))); bg.addColorStop(1, rgb(mixc(th.gB, [0, 0, 0], 0.55)));
    ctx.fillStyle = bg; rrect(sx - 2, pl.y, pl.w + 4, 17, 5); ctx.fill();
    var ptex = groundTexAt(zoneIndex(pl.x));
    if (ptex) {
      ctx.save(); rrect(sx - 2, pl.y, pl.w + 4, 17, 5); ctx.clip();
      ctx.globalAlpha = 0.62;
      var pOff = pl.x % 384;
      for (var pt = sx - 2 - pOff; pt < sx + pl.w; pt += 384) ctx.drawImage(ptex, pt, pl.y - 16, 384, 52);
      ctx.globalAlpha = 1; ctx.restore();
    }
    // lit cap
    ctx.fillStyle = 'rgba(255,244,214,0.3)'; rrect(sx, pl.y + 0.6, pl.w, 3, 2); ctx.fill();
    // brush strokes for stone grain
    ctx.strokeStyle = rgbaInk(th, 0.16); ctx.lineWidth = 1.1;
    for (var i = 1; i < 4; i++) {
      var bx = sx + (pl.w / 4) * i;
      ctx.beginPath(); ctx.moveTo(bx, pl.y + 3); ctx.quadraticCurveTo(bx + 2.5, pl.y + 9, bx + 1, pl.y + 15); ctx.stroke();
    }
    // warm rim on the sunward edge
    ctx.strokeStyle = 'rgba(255,206,150,0.34)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(sx + 1, pl.y + 4); ctx.lineTo(sx + 1, pl.y + 13); ctx.stroke();
    // grass tufts when the zone has them
    if (th.grass > 0.25) {
      ctx.strokeStyle = rgb(mixc(th.gT, [20, 90, 40], 0.45)); ctx.lineWidth = 1.4;
      for (var k = 0; k < 4; k++) {
        var gx = sx + 8 + k * (pl.w - 16) / 3 + (rnd(pl.x + k) - 0.5) * 6;
        if (rnd(pl.x + k * 7) < 0.45) continue;
        ctx.beginPath(); ctx.moveTo(gx, pl.y + 1); ctx.lineTo(gx - 1.5, pl.y - 6 - rnd(k + pl.x) * 4); ctx.stroke();
      }
    }
  });
}
function rgbaInk(th, a) { return rgb(mixc(th.gB, [0, 0, 0], 0.7), a); }
function drawBridge() {
  var t = S.bridgeT;
  var sx0 = CHASM.x - cam, w = CHASM.w;
  // posts
  function post(x) { ctx.fillStyle = '#5a4128'; ctx.fillRect(x - 5, GROUND - 56, 10, 58); ctx.fillStyle = '#7a5a38'; ctx.fillRect(x - 5, GROUND - 56, 10, 4); }
  post(sx0 - 6); post(sx0 + w + 6);
  if (t <= 0) {
    // frayed ropes and stub planks
    ctx.strokeStyle = '#a58b5a'; ctx.lineWidth = 2;
    for (var i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(sx0 - 6, GROUND - 48 + i * 20); ctx.quadraticCurveTo(sx0 + 10, GROUND - 20 + i * 16, sx0 + 16 + i * 6, GROUND + 26 + i * 8); ctx.stroke(); }
    ctx.fillStyle = '#6e5338'; ctx.fillRect(sx0, GROUND, 14, 5); ctx.save(); ctx.translate(sx0 + 22, GROUND + 4); ctx.rotate(0.5); ctx.fillRect(0, 0, 12, 5); ctx.restore();
    // sign
    ctx.fillStyle = '#4a3622'; ctx.fillRect(sx0 - 40, GROUND - 40, 4, 40);
    ctx.fillStyle = '#8a6a40'; rrect(sx0 - 66, GROUND - 52, 56, 22, 3); ctx.fill();
    ctx.fillStyle = '#2a1c0c'; ctx.font = '700 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ROTTEN', sx0 - 38, GROUND - 38); ctx.textAlign = 'left';
    return;
  }
  var len = w * t;
  // rails (sag)
  ctx.strokeStyle = '#c4a56a'; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(sx0 - 6, GROUND - 48);
  ctx.quadraticCurveTo(sx0 + len / 2, GROUND - 48 + 18 * t, sx0 + len, GROUND - 48 + (t >= 1 ? 0 : 6)); ctx.stroke();
  // deck
  for (var x = 0; x < len; x += 12) {
    ctx.fillStyle = (x / 12) % 2 ? '#7a5c3a' : '#6b4f31';
    ctx.fillRect(sx0 + x, GROUND, 11, 6);
    if (x % 36 === 0) { ctx.strokeStyle = '#a58b5a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(sx0 + x + 5, GROUND); ctx.lineTo(sx0 + x + 5, GROUND - 48 + 18 * t * (1 - Math.pow((x / len) * 2 - 1, 2)) + 0); ctx.stroke(); }
  }
}
function drawPool(th) {
  var sx = POOL.x - cam;
  if (sx > VW + 20 || sx + POOL.w < -20) return;
  var lit = S.poolUsed ? 0.25 : 1;
  ctx.fillStyle = '#10181d'; ctx.beginPath(); ctx.ellipse(sx + POOL.w / 2, GROUND + 2, POOL.w / 2 + 8, 10, 0, 0, Math.PI * 2); ctx.fill();
  var g = ctx.createRadialGradient(sx + POOL.w / 2, GROUND, 4, sx + POOL.w / 2, GROUND, POOL.w / 2);
  g.addColorStop(0, 'rgba(140,220,255,' + lit + ')'); g.addColorStop(1, 'rgba(30,90,130,' + lit + ')');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(sx + POOL.w / 2, GROUND + 1, POOL.w / 2, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,' + 0.4 * lit + ')'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(sx + POOL.w / 2, GROUND + 1, POOL.w / 4 + Math.sin(S.t * 2) * 3, 3, 0, 0, Math.PI * 2); ctx.stroke();
}
// Every stage boundary gets a cairn with a lantern post. Unlit it is just stone;
// once you reach it the flame comes up and it becomes your resume point.
// The hiding places themselves: alcoves, drums, cracks and walls.
function drawSecrets() {
  var i, sx;
  // ---- tide pocket: a low mouth in the beach rock, drowned at the surge
  sx = SECRETS[0].x - cam;
  if (sx > -120 && sx < VW + 120) {
    var arch = ctx.createLinearGradient(0, GROUND - 66, 0, GROUND + 4);
    arch.addColorStop(0, 'rgba(10,16,26,0.92)'); arch.addColorStop(1, 'rgba(24,34,44,0.98)');
    ctx.fillStyle = arch;
    ctx.beginPath(); ctx.moveTo(sx - 34, GROUND + 2); ctx.quadraticCurveTo(sx - 34, GROUND - 62, sx, GROUND - 66);
    ctx.quadraticCurveTo(sx + 34, GROUND - 62, sx + 34, GROUND + 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(150,190,180,0.22)'; ctx.lineWidth = 2; ctx.stroke();
    var wet = ctx.createLinearGradient(0, GROUND - 10, 0, GROUND + 4);
    wet.addColorStop(0, 'rgba(150,210,235,0.4)'); wet.addColorStop(1, 'rgba(60,120,160,0.15)');
    ctx.fillStyle = wet; ctx.fillRect(sx - 32, GROUND - 8, 64, 11);
    if (tideSurge()) {
      ctx.fillStyle = 'rgba(120,205,240,0.5)';
      ctx.beginPath(); ctx.moveTo(sx - 34, GROUND + 2);
      for (var wx = -34; wx <= 34; wx += 8) ctx.lineTo(sx + wx, GROUND - 54 + Math.sin(wx * 0.2 + S.t * 7) * 3);
      ctx.lineTo(sx + 34, GROUND + 2); ctx.closePath(); ctx.fill();
    }
  }
  // ---- the drum rock
  sx = 2366 - cam;
  if (sx > -140 && sx < VW + 140) {
    if (!S.open.drums) {
      var rg = ctx.createLinearGradient(sx - 44, GROUND - 96, sx + 44, GROUND);
      rg.addColorStop(0, '#6a5c48'); rg.addColorStop(1, '#3c3327');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.moveTo(sx - 44, GROUND + 2); ctx.lineTo(sx - 40, GROUND - 74); ctx.lineTo(sx - 12, GROUND - 96);
      ctx.lineTo(sx + 20, GROUND - 92); ctx.lineTo(sx + 44, GROUND - 66); ctx.lineTo(sx + 44, GROUND + 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,226,168,0.16)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(sx - 30, GROUND - 70); ctx.lineTo(sx - 6, GROUND - 40); ctx.lineTo(sx + 18, GROUND - 62); ctx.stroke();
    } else {
      // split open: two halves leaning apart, a lit slot between them
      var gl = ctx.createLinearGradient(0, GROUND - 80, 0, GROUND);
      gl.addColorStop(0, 'rgba(255,190,90,0.35)'); gl.addColorStop(1, 'rgba(255,150,60,0.08)');
      ctx.fillStyle = gl; ctx.fillRect(sx - 20, GROUND - 84, 40, 86);
      ctx.fillStyle = '#5c5040';
      ctx.beginPath(); ctx.moveTo(sx - 46, GROUND + 2); ctx.lineTo(sx - 42, GROUND - 72); ctx.lineTo(sx - 20, GROUND - 84);
      ctx.lineTo(sx - 20, GROUND + 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#4a4034';
      ctx.beginPath(); ctx.moveTo(sx + 46, GROUND + 2); ctx.lineTo(sx + 42, GROUND - 74); ctx.lineTo(sx + 22, GROUND - 82);
      ctx.lineTo(sx + 22, GROUND + 2); ctx.closePath(); ctx.fill();
    }
    for (i = 0; i < 3; i++) {
      var dx = DRUM_X[i] - cam, dhit = S.drumsHit[i];
      ctx.fillStyle = dhit ? '#8a6a44' : '#6d5537';
      rrect(dx - 9, GROUND - 34, 18, 34, 4); ctx.fill();
      ctx.fillStyle = dhit ? 'rgba(255,214,138,0.8)' : 'rgba(210,180,130,0.35)';
      ctx.beginPath(); ctx.ellipse(dx, GROUND - 34, 9, 3.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(20,14,8,0.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(dx - 8, GROUND - 22); ctx.lineTo(dx + 8, GROUND - 22); ctx.moveTo(dx - 8, GROUND - 12); ctx.lineTo(dx + 8, GROUND - 12); ctx.stroke();
    }
    if (!S.open.drums && Math.abs(S.p.x - 2366) < 110) drawPrompt(2366 - cam, GROUND - 108, 'X', 'ring the drums');
  }
  // ---- cracked seam in the cave wall
  sx = SEAM_X - cam;
  if (sx > -80 && sx < VW + 80) {
    if (!S.open.seam) {
      var sg = ctx.createLinearGradient(sx - 20, GROUND - 80, sx + 20, GROUND);
      sg.addColorStop(0, 'rgba(20,26,40,0.9)'); sg.addColorStop(1, 'rgba(8,12,22,0.95)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.moveTo(sx - 22, GROUND + 2); ctx.lineTo(sx - 16, GROUND - 62); ctx.lineTo(sx + 6, GROUND - 84);
      ctx.lineTo(sx + 20, GROUND - 58); ctx.lineTo(sx + 22, GROUND + 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(130,230,255,' + (0.45 + 0.25 * Math.sin(S.t * 3)) + ')'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(sx - 4, GROUND - 78); ctx.lineTo(sx + 2, GROUND - 50); ctx.lineTo(sx - 6, GROUND - 34); ctx.lineTo(sx + 4, GROUND - 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx + 2, GROUND - 50); ctx.lineTo(sx + 16, GROUND - 40); ctx.stroke();
      if (Math.abs(S.p.x - SEAM_X) < 120) drawPrompt(SEAM_X - cam, GROUND - 104, 'X', 'split the seam');
    } else {
      ctx.fillStyle = 'rgba(6,9,18,0.95)';
      ctx.beginPath(); ctx.moveTo(sx - 24, GROUND + 2); ctx.lineTo(sx - 16, GROUND - 64); ctx.lineTo(sx + 8, GROUND - 84);
      ctx.lineTo(sx + 22, GROUND - 56); ctx.lineTo(sx + 24, GROUND + 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(130,230,255,0.3)'; ctx.lineWidth = 1.4; ctx.stroke();
    }
  }
  // ---- the keeper's wall
  sx = CACHE_X - cam;
  if (sx > -80 && sx < VW + 80) {
    if (!S.open.cache) {
      for (i = 0; i < 4; i++) {
        var by = GROUND - 22 - i * 22;
        ctx.fillStyle = i % 2 ? '#6a6154' : '#5b5347';
        rrect(sx - 11 + (i % 2 ? 2 : -1), by, 22, 20, 3); ctx.fill();
        ctx.fillStyle = 'rgba(255,235,200,0.12)'; ctx.fillRect(sx - 10, by + 1, 20, 2);
      }
      if (S.cacheHp < 3) {
        ctx.strokeStyle = 'rgba(20,16,12,0.7)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(sx - 6, GROUND - 70); ctx.lineTo(sx + 3, GROUND - 44); ctx.lineTo(sx - 4, GROUND - 20); ctx.stroke();
      }
      if (Math.abs(S.p.x - CACHE_X) < 120) drawPrompt(CACHE_X - cam, GROUND - 112, 'X', 'break the wall');
    } else {
      ctx.fillStyle = '#574f44';
      for (i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(sx - 16 + i * 13, GROUND - 3 + (i % 2) * 2, 8, 4, 0.2 * i, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = 'rgba(8,10,16,0.8)';
      ctx.beginPath(); ctx.moveTo(sx - 12, GROUND + 2); ctx.lineTo(sx - 8, GROUND - 40); ctx.lineTo(sx + 10, GROUND - 38); ctx.lineTo(sx + 12, GROUND + 2); ctx.closePath(); ctx.fill();
    }
  }
  // ---- the hollow log
  sx = LOG_X - cam;
  if (sx > -90 && sx < VW + 90) {
    var lg2 = ctx.createLinearGradient(sx - 26, GROUND - 30, sx + 26, GROUND);
    lg2.addColorStop(0, '#6b5233'); lg2.addColorStop(1, '#3d2d1a');
    ctx.fillStyle = lg2;
    rrect(sx - 26, GROUND - 30, 52, 32, 14); ctx.fill();
    ctx.fillStyle = 'rgba(4,6,10,0.92)';
    ctx.beginPath(); ctx.ellipse(sx + 24, GROUND - 14, 7, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,230,190,0.16)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(sx - 22, GROUND - 26); ctx.quadraticCurveTo(sx, GROUND - 34, sx + 20, GROUND - 26); ctx.stroke();
    ctx.fillStyle = '#3f6b34';
    for (i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(sx - 18 + i * 11, GROUND - 32 - (i % 2) * 3, 5, 3, -0.4, 0, Math.PI * 2); ctx.fill(); }
    if (!S.logUsed && Math.abs(S.p.x - LOG_X) < 100) drawPrompt(LOG_X - cam, GROUND - 70, touchMode ? 'Use' : 'E', 'slip through');
  }
}
function drawCheckpoints() {
  for (var i = 1; i < CHECKPOINTS.length; i++) {
    var cx = CHECKPOINTS[i].x, sx = cx - cam;
    if (sx < -80 || sx > VW + 80) continue;
    var lit = i <= S.cpI;
    var bloom = (i === S.cpI && S.cpT < 1.15) ? 1 - S.cpT / 1.15 : 0;
    shadowAt(cx + 2, GROUND, 30, 0.28);
    // stacked stones
    var stones = [[-16, 0, 10, 5.6, -0.1], [-13, -8, 7.6, 4.4, 0.1], [-10, -15, 5.4, 3.3, -0.12]];
    for (var s = 0; s < stones.length; s++) {
      var st = stones[s], bx = sx + st[0], by = GROUND + st[1], bw = st[2], bh = st[3];
      var sg = ctx.createLinearGradient(bx - bw, by - bh, bx + bw, by + bh);
      sg.addColorStop(0, '#98a0aa'); sg.addColorStop(0.5, '#646c76'); sg.addColorStop(1, '#39404a');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.ellipse(bx, by, bw, bh, st[4], 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = lit ? 'rgba(255,226,168,0.34)' : 'rgba(200,225,240,0.22)';
      ctx.beginPath(); ctx.ellipse(bx + bw * 0.34, by - bh * 0.46, bw * 0.34, bh * 0.28, -0.2, 0, Math.PI * 2); ctx.fill();
    }
    // post
    var pg = ctx.createLinearGradient(sx + 6, GROUND - 76, sx + 16, GROUND);
    pg.addColorStop(0, '#8d6c46'); pg.addColorStop(0.5, '#a58154'); pg.addColorStop(1, '#4a3721');
    ctx.fillStyle = pg; rrect(sx + 8, GROUND - 76, 8, 76, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,224,162,0.26)'; ctx.fillRect(sx + 14.2, GROUND - 74, 1.9, 72);
    // arm and pennant
    ctx.strokeStyle = '#7a5c39'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx + 12, GROUND - 72); ctx.quadraticCurveTo(sx + 22, GROUND - 78, sx + 30, GROUND - 70); ctx.stroke();
    var fl = Math.sin(S.t * 2.3 + i * 1.7) * 2.6;
    ctx.fillStyle = lit ? 'rgba(208,94,62,0.95)' : 'rgba(108,80,66,0.72)';
    ctx.beginPath(); ctx.moveTo(sx + 9, GROUND - 74);
    ctx.quadraticCurveTo(sx - 4, GROUND - 70 + fl, sx - 16, GROUND - 72 + fl * 1.5);
    ctx.quadraticCurveTo(sx - 4, GROUND - 63 + fl, sx + 9, GROUND - 59);
    ctx.closePath(); ctx.fill();
    // lantern
    var lx = sx + 30, ly = GROUND - 56;
    if (lit) {
      var glow = 0.42 + 0.1 * Math.sin(S.t * 3.1 + i) + bloom * 0.55;
      var rad = 40 + bloom * 26;
      var rg = ctx.createRadialGradient(lx, ly, 1, lx, ly, rad);
      rg.addColorStop(0, 'rgba(255,206,120,' + Math.min(0.8, glow) + ')');
      rg.addColorStop(0.42, 'rgba(255,168,74,' + Math.min(0.32, glow * 0.42) + ')');
      rg.addColorStop(1, 'rgba(255,150,60,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(lx, ly, rad, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,188,104,' + (0.13 + bloom * 0.18) + ')';
      ctx.beginPath(); ctx.ellipse(lx, GROUND + 1, 36, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,206,130,' + (0.12 + bloom * 0.14) + ')';
      ctx.beginPath(); ctx.ellipse(lx, GROUND + 1, 20, 5.5, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#2d271f'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(lx, GROUND - 70); ctx.lineTo(lx, GROUND - 64); ctx.stroke();
    ctx.fillStyle = '#3b332a'; rrect(lx - 6.2, ly - 8, 12.4, 17, 3); ctx.fill();
    ctx.fillStyle = lit ? '#ffd98c' : 'rgba(126,148,160,0.45)';
    rrect(lx - 3.8, ly - 5, 7.6, 10.5, 2); ctx.fill();
    if (lit) { ctx.fillStyle = 'rgba(255,255,240,0.92)'; ctx.beginPath(); ctx.arc(lx, ly - 0.5, 2.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.34)'; rrect(lx - 7, ly + 8, 14, 3, 1.5); ctx.fill();
    if (bloom > 0) {
      ctx.strokeStyle = 'rgba(255,214,138,' + (bloom * 0.75) + ')'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(lx, ly, (1 - bloom) * 54 + 9, 0, Math.PI * 2); ctx.stroke();
    }
  }
}
function drawTutGate() {
  if (S.tutGate) return;
  var x = TUT_GATE_X - cam;
  if (x < -90 || x > VW + 90) return;
  shadowAt(TUT_GATE_X, GROUND, 42, 0.32);
  ctx.fillStyle = '#6b4a2b';
  rrect(x - 18, GROUND - 60, 9, 60, 3); ctx.fill();
  rrect(x + 9, GROUND - 60, 9, 60, 3); ctx.fill();
  ctx.fillStyle = 'rgba(255,214,140,0.22)';
  ctx.fillRect(x - 17, GROUND - 60, 2.4, 60); ctx.fillRect(x + 10, GROUND - 60, 2.4, 60);
  for (var i = 0; i < 4; i++) {
    var yy = GROUND - 12 - i * 13;
    ctx.save(); ctx.translate(x, yy); ctx.rotate((i % 2 ? 1 : -1) * 0.035);
    var g = ctx.createLinearGradient(-22, 0, 22, 0);
    g.addColorStop(0, '#8a6236'); g.addColorStop(0.5, '#ab7a46'); g.addColorStop(1, '#5a3f22');
    ctx.fillStyle = g; rrect(-22, -5, 44, 9.5, 3); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.26)'; ctx.fillRect(-22, 2, 44, 1.6);
    ctx.restore();
  }
  ctx.strokeStyle = '#d9b878'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - 17, GROUND - 54); ctx.lineTo(x + 16, GROUND - 16); ctx.moveTo(x + 17, GROUND - 54); ctx.lineTo(x - 16, GROUND - 16); ctx.stroke();
  if (Math.abs(S.p.x - TUT_GATE_X) < 110) drawPrompt(x, GROUND - 80, touchMode ? 'Use' : 'E', 'shove the gate');
}

function drawVines(b) {
  var sx = b.x - cam;
  if (sx < -30 || sx > VW + 30) return;
  ctx.strokeStyle = '#2f7a3f'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (var i = 0; i < 5; i++) {
    var ox = (i - 2) * 5 + Math.sin(S.t * 1.4 + i) * 2;
    ctx.beginPath(); ctx.moveTo(sx + ox, GROUND); ctx.bezierCurveTo(sx + ox + 12, GROUND - 40, sx + ox - 12, GROUND - 80, sx + ox, GROUND - 130); ctx.stroke();
  }
  ctx.strokeStyle = '#a8c86a'; ctx.lineWidth = 1.5;
  for (var k = 0; k < 8; k++) { var y = GROUND - 12 - k * 15; ctx.beginPath(); ctx.moveTo(sx - 10, y); ctx.lineTo(sx - 15, y - 5); ctx.moveTo(sx + 10, y - 6); ctx.lineTo(sx + 15, y - 11); ctx.stroke(); }
}
function drawTower() {
  var sx = BEACON_X - cam;
  if (sx < -140 || sx > VW + 140) return;
  var lit = S.mode === 'winning' || S.mode === 'won';
  var litAmt = lit ? sm((S.winT - 0.7) / 0.6) : 0;
  ctx.save(); ctx.translate(sx, GROUND);
  if (litAmt > 0) {
    for (var s = -1; s <= 1; s += 2) {
      var bg = ctx.createLinearGradient(0, -250, s * 340, -250);
      bg.addColorStop(0, 'rgba(255,214,120,' + 0.55 * litAmt + ')'); bg.addColorStop(1, 'rgba(255,214,120,0)');
      ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(0, -252); ctx.lineTo(s * 340, -300); ctx.lineTo(s * 340, -200); ctx.closePath(); ctx.fill();
    }
  }
  var g = ctx.createLinearGradient(-30, 0, 30, 0);
  g.addColorStop(0, '#b8b3a2'); g.addColorStop(0.5, '#ece8d8'); g.addColorStop(1, '#9d9886');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-36, 0); ctx.lineTo(-20, -240); ctx.lineTo(20, -240); ctx.lineTo(36, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b9473c';
  [[-30, -50, -27, -90], [-24, -130, -22, -170]].forEach(function (b) {
    var k0 = (b[1] / -240), k1 = (b[3] / -240);
    var w0 = 36 - 16 * k0, w1 = 36 - 16 * k1;
    ctx.beginPath(); ctx.moveTo(-w0, b[1]); ctx.lineTo(-w1, b[3]); ctx.lineTo(w1, b[3]); ctx.lineTo(w0, b[1]); ctx.closePath(); ctx.fill();
  });
  ctx.fillStyle = '#3a2c20'; rrect(-10, -44, 20, 44, 8); ctx.fill();
  ctx.fillStyle = '#2a343c'; ctx.fillRect(-26, -246, 52, 8);
  ctx.fillStyle = '#b9473c'; ctx.beginPath(); ctx.moveTo(-18, -264); ctx.lineTo(0, -286); ctx.lineTo(18, -264); ctx.closePath(); ctx.fill();
  ctx.fillStyle = litAmt > 0 ? 'rgba(255,214,110,' + (0.4 + 0.6 * litAmt) + ')' : '#3c4a52'; ctx.fillRect(-12, -264, 24, 18);
  if (litAmt > 0) { var rg = ctx.createRadialGradient(0, -255, 4, 0, -255, 150); rg.addColorStop(0, 'rgba(255,220,130,' + 0.7 * litAmt + ')'); rg.addColorStop(1, 'rgba(255,220,130,0)'); ctx.fillStyle = rg; ctx.fillRect(-160, -400, 320, 300); }
  ctx.restore();
}
function drawSpearShape(len) {
  ctx.strokeStyle = '#8a6a40'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-len / 2, 0); ctx.lineTo(len / 2, 0); ctx.stroke();
  ctx.fillStyle = '#cfd6d8'; ctx.beginPath(); ctx.moveTo(len / 2 + 9, 0); ctx.lineTo(len / 2 - 2, -3.5); ctx.lineTo(len / 2 - 2, 3.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d96b4a'; ctx.beginPath(); ctx.moveTo(-len / 2, 0); ctx.lineTo(-len / 2 - 5, -3); ctx.lineTo(-len / 2 + 3, 0); ctx.lineTo(-len / 2 - 5, 3); ctx.closePath(); ctx.fill();
}

function drawItem(it) {
  if (it.got) return;
  if (it.type === 'sun' && !sunOpen(it.sid)) return;   // still sealed in its hiding place
  var sx = it.x - cam; if (sx < -30 || sx > VW + 30) return;
  var bob = Math.sin(S.t * 3 + it.x) * 3, y = it.y + bob;
  if (it.type === 'fruit') {
    ell(sx, y, 8, 8, '#e8923b'); ell(sx - 2, y - 2, 3, 3, 'rgba(255,255,255,0.4)');
    ctx.fillStyle = '#4aa35a'; ctx.beginPath(); ctx.ellipse(sx + 3, y - 9, 5, 2.4, -0.5, 0, Math.PI * 2); ctx.fill();
  } else if (it.type === 'rope') {
    var g = ctx.createRadialGradient(sx, y, 2, sx, y, 36); g.addColorStop(0, 'rgba(255,220,130,0.55)'); g.addColorStop(1, 'rgba(255,220,130,0)'); ctx.fillStyle = g; ctx.fillRect(sx - 40, y - 40, 80, 80);
    ctx.strokeStyle = '#d7b878'; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.ellipse(sx, y + 2, 15, 7, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(sx, y, 9, 4, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx + 14, y + 4); ctx.quadraticCurveTo(sx + 24, y + 10, sx + 30, y + 4); ctx.stroke();
  } else if (it.type === 'sun') {
    var pu = 0.75 + 0.25 * Math.sin(S.t * 2.6 + it.x);
    var gg = ctx.createRadialGradient(sx, y, 2, sx, y, 54);
    gg.addColorStop(0, 'rgba(255,205,90,' + 0.55 * pu + ')'); gg.addColorStop(0.5, 'rgba(255,170,60,0.2)'); gg.addColorStop(1, 'rgba(255,150,50,0)');
    ctx.fillStyle = gg; ctx.fillRect(sx - 58, y - 58, 116, 116);
    // faceted amber stone
    ctx.save(); ctx.translate(sx, y); ctx.rotate(Math.sin(S.t * 0.9 + it.x) * 0.12);
    var fg = ctx.createLinearGradient(-9, -11, 9, 11);
    fg.addColorStop(0, '#fff0bd'); fg.addColorStop(0.45, '#ffc94e'); fg.addColorStop(1, '#d97a1f');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(9, -3); ctx.lineTo(6, 9); ctx.lineTo(-6, 9); ctx.lineTo(-9, -3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,235,0.75)';
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(4.4, -3.5); ctx.lineTo(0, 2); ctx.lineTo(-4.4, -3.5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(120,60,10,0.45)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 9); ctx.moveTo(-9, -3); ctx.lineTo(9, -3); ctx.stroke();
    ctx.restore();
  } else if (it.type === 'lantern') {
    var fl = 0.8 + 0.2 * Math.sin(S.t * 9);
    var g2 = ctx.createRadialGradient(sx, y, 2, sx, y, 60); g2.addColorStop(0, 'rgba(255,200,90,' + 0.7 * fl + ')'); g2.addColorStop(1, 'rgba(255,200,90,0)'); ctx.fillStyle = g2; ctx.fillRect(sx - 64, y - 64, 128, 128);
    ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, y - 12, 5, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#2f2f2f'; ctx.fillRect(sx - 8, y - 12, 16, 3); ctx.fillRect(sx - 8, y + 9, 16, 3);
    ctx.fillStyle = 'rgba(255,214,110,' + fl + ')'; ctx.fillRect(sx - 6, y - 9, 12, 18);
    ctx.fillStyle = '#fff6cf'; ctx.fillRect(sx - 2, y - 4, 4, 8);
  }
}

// ---------------------------------------------------------------- characters
function shadowAt(x, y, w, a) {
  ctx.save(); ctx.translate(x - cam, y); ctx.scale(1, 0.22);
  var g = ctx.createRadialGradient(0, 0, 1, 0, 0, w);
  g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, w, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
// ------------------------------------------------ painted hunter
// Hand-painted poses, one texture each. Offsets place every pose on the same
// feet line so swapping between them never makes the hunter jitter.
var HUNTER_META = {"idle":{"w":20.5,"h":64.0,"dx":-12.38,"dy":-64.19},"run1":{"w":50.5,"h":61.5,"dx":-34.45,"dy":-63.94},"run2":{"w":51.5,"h":61.5,"dx":-35.36,"dy":-64.0},"jump":{"w":38.5,"h":56.5,"dx":-21.84,"dy":-63.09},"stab":{"w":60.0,"h":54.5,"dx":-38.24,"dy":-59.0},"run3":{"w":53.0,"h":61.5,"dx":-34.2,"dy":-64.0}};
var HUNTER_SPR = {};
(function loadHunter() {
  for (var k in HUNTER_META) (function (k) {
    var im = new Image(), m = HUNTER_META[k];
    var o = { img: im, ready: false, w: m.w, h: m.h, dx: m.dx, dy: m.dy };
    HUNTER_SPR[k] = o;
    im.onload = function () { o.ready = im.naturalWidth > 0; };
    im.src = 'art/hunter_' + k + '.webp?v=' + ASSET_V;
  })(k);
})();
function hunterPose(p, run) {
  if (p.stab > 0) return 'stab';
  if (!p.onGround) return 'jump';
  if (run) return ['run1', 'run2', 'run3', 'run2'][Math.floor(p.ph / (Math.PI / 2)) & 3];
  return 'idle';
}
function hunterFallback() {
  ctx.fillStyle = '#422a18'; rrect(-8, -24, 6.5, 24, 3); ctx.fill();
  ctx.fillStyle = '#5f3f24'; rrect(1.5, -24, 6.5, 24, 3); ctx.fill();
  var g = ctx.createLinearGradient(-8, -46, 8, -24);
  g.addColorStop(0, '#9d7a3c'); g.addColorStop(0.55, '#d9b76d'); g.addColorStop(1, '#f2d79a');
  ctx.fillStyle = g; rrect(-8, -46, 16, 24, 4); ctx.fill();
  ctx.fillStyle = '#e9b98c'; ctx.beginPath(); ctx.ellipse(1, -51, 7, 7.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#b58a4a'; ctx.beginPath(); ctx.ellipse(1, -55.6, 12.8, 3.3, 0, 0, Math.PI * 2); ctx.fill();
}

function drawHunter() {
  var p = S.p;
  if (S.mode === 'dead') return;
  // soft contact shadow on the ground below (fades as you jump)
  var gy = p.onGround ? p.y : (solidAt(p.x) ? GROUND : -1);
  if (gy > 0) shadowAt(p.x, gy, 22 - Math.min(10, (gy - p.y) * 0.06), clamp(0.5 - (gy - p.y) / 260, 0.1, 0.5));
  var blink = p.inv > 0 && Math.floor(p.inv * 14) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.35;
  var run = Math.abs(p.vx) > 10 && p.onGround;
  var ph = p.ph || 0, spd = Math.min(1, Math.abs(p.vx) / RUN);
  var bob = run ? -Math.abs(Math.sin(ph)) * 3.1 : Math.sin(S.t * 2.2) * 0.5;
  var lean = run ? 0.045 + 0.085 * spd + Math.sin(ph) * 0.012 : (p.vy < -50 ? -0.05 : (p.vy > 200 ? 0.06 : 0));
  ctx.save(); ctx.translate(p.x - cam, p.y); ctx.scale(p.face, 1);
  var contact = run ? Math.abs(Math.cos(ph)) * 0.055 : 0;   // dip as each foot plants
  ctx.scale(1 + p.sq * 0.55 + contact * 0.5, 1 - p.sq - contact);
  ctx.translate(0, bob);
  ctx.rotate(lean);

  var spr = HUNTER_SPR[hunterPose(p, run)];
  if (spr && spr.ready) ctx.drawImage(spr.img, spr.dx, spr.dy, spr.w, spr.h);
  else hunterFallback();

  var baseA = ctx.globalAlpha;
  // ---------------- lantern on the belt
  if (p.lantern) {
    var sw = Math.sin(S.t * 5 + (run ? p.anim * 8 : 0)) * (run ? 2 : 0.6);
    ctx.save(); ctx.translate(7, -25); ctx.rotate(sw * 0.05);
    ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 3); ctx.stroke();
    ctx.fillStyle = 'rgba(255,190,90,' + (0.2 + 0.05 * Math.sin(S.t * 13)) + ')'; ctx.beginPath(); ctx.arc(0, 8, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2f2f2f'; ctx.fillRect(-3.5, 3, 7, 1.7); ctx.fillRect(-3.5, 12, 7, 1.7);
    var lgg = ctx.createLinearGradient(-2.8, 4.6, 2.8, 12);
    lgg.addColorStop(0, '#fff2c2'); lgg.addColorStop(0.6, '#ffd66e'); lgg.addColorStop(1, '#e8a63c');
    ctx.fillStyle = lgg; ctx.fillRect(-2.8, 4.6, 5.6, 7.4);
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(-1.2, 6.2, 1.4, 3.6);
    ctx.restore();
  }

  // ---------------- spear, held in the painted hand position
  ctx.globalAlpha = baseA;
  if (p.stab > 0) {
    var reach = Math.sin((1 - p.stab / 0.18) * Math.PI) * 14;
    ctx.save(); ctx.translate(16 + reach, -34); drawSpearShape(46); ctx.restore();
  } else if (p.throwT > 0) {
    ctx.save(); ctx.translate(14, -40); ctx.rotate(-0.5); drawSpearShape(46); ctx.restore();
  } else {
    ctx.save(); ctx.translate(11, -31); ctx.rotate(-1.35 + (run ? Math.sin(ph) * 0.13 : 0)); drawSpearShape(46); ctx.restore();
  }

  // ---------------- lantern glow over the body
  if (p.lantern) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,170,70,0.07)'; rrect(-9, -46, 18, 26, 5); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
  ctx.restore();
  ctx.globalAlpha = 1;
}

// ------------------------------------------------ painted enemies
// Each creature is one or two painted poses, sized to its collision box and
// anchored on its feet so state changes never shift it off the ground.
var ENEMY_META = {"crab1":{"w":43.5,"h":26.0,"dx":-21.75,"dy":-26.0},"snake1":{"w":44.0,"h":34.0,"dx":-22.0,"dy":-34.0},"bat1":{"w":33.5,"h":32.0,"dx":-16.75,"dy":-32.0},"boar1":{"w":52.5,"h":42.0,"dx":-26.25,"dy":-42.0},"panther1":{"w":81.5,"h":44.0,"dx":-40.75,"dy":-44.0},"panther2":{"w":118.5,"h":44.0,"dx":-59.25,"dy":-44.0},"boss1":{"w":148.0,"h":94.0,"dx":-74.0,"dy":-94.0}};
var ENEMY_SPR = {};
(function loadEnemies() {
  for (var k in ENEMY_META) (function (k) {
    var im = new Image(), m = ENEMY_META[k];
    var o = { img: im, ready: false, w: m.w, h: m.h, dx: m.dx, dy: m.dy };
    ENEMY_SPR[k] = o;
    im.onload = function () { o.ready = im.naturalWidth > 0; };
    im.src = 'art/' + k + '.webp?v=' + ASSET_V;
  })(k);
})();
function enemyPose(e, t) {
  if (e.type === 'panther') return e.state === 'leap' ? 'panther2' : 'panther1';
  if (e.type === 'boss') return 'boss1';
  if (e.type === 'boar') return 'boar1';
  if (e.type === 'bat') return 'bat1';
  if (e.type === 'snake') return 'snake1';
  return 'crab1';
}

function drawEnemy(e) {
  var sx = e.x - cam;
  if (sx < -140 || sx > VW + 140) return;
  var fade = e.dying ? Math.max(0, 1 - e.dying / 0.45) : 1;
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.translate(sx, e.y);
  if (e.dying) { ctx.rotate(e.dying * 4 * (e.dir || 1)); ctx.translate(0, e.dying * 20); }
  ctx.scale(e.dir || 1, 1);
  if (e.hurt > 0 && 'filter' in ctx) ctx.filter = 'brightness(2.6)';
  var t = e.t, name = enemyPose(e, t), s = ENEMY_SPR[name];

  // the boss throws its own storm light
  if (e.type === 'boss') {
    var rage = e.hp <= e.maxhp / 2;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var bg = ctx.createRadialGradient(0, -30, 4, 0, -30, 62);
    bg.addColorStop(0, 'rgba(' + (rage ? '190,110,255' : '130,90,240') + ',' + (rage ? 0.34 : 0.2) + ')');
    bg.addColorStop(1, 'rgba(120,80,220,0)');
    ctx.fillStyle = bg; ctx.fillRect(-70, -96, 140, 100);
    ctx.restore();
  }

  if (e.type !== 'bat' && !e.dying) shadowAt(e.x, e.y, (s ? s.w : e.w) * 0.42, 0.34);
  if (s && s.ready) {
    // a little life: bats beat, everything else breathes
    var amp = e.type === 'bat' ? 2.6 : (e.type === 'boss' || e.type === 'panther' ? 0.6 : 0.9);
    var spd = e.type === 'bat' ? 9 : 2.6;
    var bob = Math.sin(t * spd + e.x * 0.05) * amp;
    var lift = (e.state === 'leap' && e.type === 'panther') ? -6 : 0;
    if (e.type === 'bat') {
      ctx.save();
      ctx.translate(0, s.dy * 0.5);
      ctx.scale(1 + Math.sin(t * 18) * 0.04, 1 + Math.sin(t * 18) * 0.14);
      ctx.translate(0, -s.dy * 0.5);
      ctx.drawImage(s.img, s.dx, s.dy + bob, s.w, s.h);
      ctx.restore();
    } else {
      ctx.drawImage(s.img, s.dx, s.dy + bob + lift, s.w, s.h);
    }
  } else {
    ctx.fillStyle = e.type === 'boss' ? '#3a2358' : '#7a3a2a';
    rrect(-e.w / 2, -e.h, e.w, e.h, 5); ctx.fill();
  }
  if (e.type === 'boss' && e.hp <= e.maxhp / 2 && s && s.ready) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(200,140,255,' + (0.2 + 0.2 * Math.abs(Math.sin(t * 7))) + ')';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-26, -50); ctx.lineTo(-14, -44); ctx.lineTo(-22, -34); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(18, -48); ctx.lineTo(26, -40); ctx.lineTo(16, -32); ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }
  if ('filter' in ctx) ctx.filter = 'none';
  ctx.restore();
}

function drawTie() {
  if (!S.tie) return;
  var p = S.p, t = S.tie.t;
  var x0 = p.x - cam + 14, y0 = p.y - 36;
  var x1 = CHASM.x + CHASM.w + 6 - cam, y1 = GROUND - 50;
  var q = clamp(t / 0.5, 0, 1);
  var ex = x0 + (x1 - x0) * q, ey = y0 + (y1 - y0) * q;
  var cx = (x0 + ex) / 2, cy = Math.min(y0, ey) - 46 * (1 - q * 0.6) + (q >= 1 ? 40 : 0);
  ctx.strokeStyle = '#d7b878'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
  if (q < 1) { ell(ex, ey, 4, 4, '#a58b5a'); }
}
// The lantern rising up the tower into the lamp room while the beacon is being lit.
function drawLanternFlight() {
  if (S.mode !== 'winning' || S.winT > 0.9) return;
  var q = clamp(S.winT / 0.8, 0, 1), e = q * q * (3 - 2 * q);
  var x0 = S.p.x - cam + 10, y0 = S.p.y - 44, x1 = BEACON_X - cam, y1 = GROUND - 256;
  var x = x0 + (x1 - x0) * e, y = y0 + (y1 - y0) * e - Math.sin(q * Math.PI) * 26;
  var fl = 0.85 + 0.15 * Math.sin(S.t * 14);
  var g = ctx.createRadialGradient(x, y, 2, x, y, 48);
  g.addColorStop(0, 'rgba(255,200,90,' + 0.8 * fl + ')'); g.addColorStop(1, 'rgba(255,200,90,0)');
  ctx.fillStyle = g; ctx.fillRect(x - 50, y - 50, 100, 100);
  ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - 12, 5, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = '#2f2f2f'; ctx.fillRect(x - 8, y - 12, 16, 3); ctx.fillRect(x - 8, y + 9, 16, 3);
  ctx.fillStyle = 'rgba(255,214,110,' + fl + ')'; ctx.fillRect(x - 6, y - 9, 12, 18);
  ctx.fillStyle = '#fff6cf'; ctx.fillRect(x - 2, y - 4, 4, 8);
}
// A small "press this key" bubble above the hunter.
function drawPrompt(x, y, keyText, label) {
  ctx.font = '700 11px Karla, sans-serif';
  var cap = keyText.length > 1 ? 30 : 18;
  var w = ctx.measureText(label).width + cap + 22;
  ctx.fillStyle = 'rgba(5,12,9,0.82)'; rrect(x - w / 2, y - 16, w, 24, 7); ctx.fill();
  ctx.strokeStyle = '#f6b73c'; ctx.lineWidth = 1.2; rrect(x - w / 2, y - 16, w, 24, 7); ctx.stroke();
  ctx.fillStyle = '#f6b73c'; rrect(x - w / 2 + 5, y - 12, cap, 16, 4); ctx.fill();
  ctx.fillStyle = '#2a1c04'; ctx.textAlign = 'center'; ctx.fillText(keyText, x - w / 2 + 5 + cap / 2, y);
  ctx.fillStyle = '#f2eedd'; ctx.textAlign = 'left'; ctx.fillText(label, x - w / 2 + cap + 11, y);
  ctx.beginPath(); ctx.moveTo(x - 5, y + 8); ctx.lineTo(x, y + 14); ctx.lineTo(x + 5, y + 8); ctx.fillStyle = 'rgba(5,12,9,0.82)'; ctx.fill();
}

// ---------------------------------------------------------------- render
var flies = [];
var DUST = ['#e8d6a4', '#6b5a38', '#8a949c', '#9a8a6a', '#7f8a90'];
for (var fi = 0; fi < 26; fi++) flies.push({ x: rnd(fi) * 700, y: 80 + rnd(fi + 40) * 190, ph: rnd(fi + 7) * 6 });

// ---------------------------------------------------------------- painted backdrops
// One hand-painted vista per zone, loaded from art/. If a file is missing the
// procedural sky keeps drawing, so the game never shows a blank frame.
var ART_NAMES = ['beach', 'jungle', 'cave', 'bridge', 'lighthouse'];
var GROUND_TEX = [], GROUND_OK = [];
(function loadGroundTex() {
  for (var i = 0; i < ART_NAMES.length; i++) (function (i) {
    var im = new Image();
    im.onload = function () { GROUND_OK[i] = im.naturalWidth > 0; };
    im.onerror = function () { GROUND_OK[i] = false; };
    im.src = 'art/ground_' + ART_NAMES[i] + '.webp?v=' + ASSET_V;
    GROUND_TEX[i] = im;
  })(i);
})();
function groundTexAt(i) { var im = GROUND_TEX[i]; return (im && GROUND_OK[i]) ? im : null; }
var ART = [], ART_OK = [];
(function loadPaintedArt() {
  for (var i = 0; i < ART_NAMES.length; i++) (function (i) {
    var im = new Image();
    im.onload = function () { ART_OK[i] = im.naturalWidth > 0; };
    im.onerror = function () { ART_OK[i] = false; };
    im.src = 'art/' + ART_NAMES[i] + '.webp?v=' + ASSET_V;
    ART[i] = im;
  })(i);
})();
function drawPaintedLayer(i, alpha) {
  var im = ART[i];
  if (!im || !ART_OK[i] || alpha <= 0.004) return;
  var pad = VW * 0.09;                       // slack for the slow parallax drift
  var dw = VW + pad * 2, dh = H;
  var ir = im.naturalWidth / im.naturalHeight, cr = dw / dh, sx = 0, sy = 0, sw = im.naturalWidth, sh = im.naturalHeight;
  if (ir > cr) { sw = sh * cr; sx = (im.naturalWidth - sw) * 0.5; }
  else { sh = sw / cr; sy = (im.naturalHeight - sh) * 0.55; }
  var br = 1.048 + 0.014 * Math.sin(S.t * 0.13 + i * 2.1);
  var drift = -pad - ((cam * 0.045) % pad) + Math.sin(S.t * 0.071 + i) * 9 + (S.p.vx || 0) * 0.025;
  var driftY = Math.sin(S.t * 0.05 + i * 1.3) * 3;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(VW / 2, H * 0.56); ctx.scale(br, br); ctx.translate(-VW / 2, -H * 0.56);
  ctx.drawImage(im, sx, sy, sw, sh, drift, driftY, dw, dh);
  ctx.restore();
  ctx.globalAlpha = 1;
}
function drawBackdrop() {
  var cx = cam + VW / 2, i = zoneIndex(cx), z = ZONES_META[i], j = -1, f = 0;
  if (i < ZONES_META.length - 1 && cx > z.x1 - 220) { j = i + 1; f = sm((cx - (z.x1 - 220)) / 220); }
  else if (i > 0 && cx < z.x0 + 220) { j = i - 1; f = sm((z.x0 + 220 - cx) / 220); }
  var a = ART_OK[i], b = j >= 0 && ART_OK[j];
  if (!a && !b) return false;
  if (a && b) { drawPaintedLayer(i, 1); drawPaintedLayer(j, f); }
  else if (a) drawPaintedLayer(i, 1);
  else drawPaintedLayer(j, 1);
  return true;
}

// ---------------------------------------------------------------- living air
// The plates are photographs, so the life has to come from what moves between
// the camera and them: cloud shadow, ground haze, drifting motes, wind, weather
// and the out-of-focus grass and leaves you are standing behind.
var MOTES = (function () {
  var m = [];
  for (var i = 0; i < 72; i++) m.push({
    x: rnd(i * 3.1), y: rnd(i * 7.7), r: 0.5 + rnd(i * 1.3) * 1.7,
    sp: 0.35 + rnd(i * 5.1) * 1.3, ph: rnd(i * 2.2) * 6.283,
    dp: 0.25 + rnd(i * 9.3) * 0.9, sw: rnd(i * 4.4) * 6.283
  });
  return m;
})();
var LIFE_TINT = ['#ffe2b4', '#e9ffb4', '#a8ecff', '#cfe0ff', '#e2edff'];
var lFlash = 0;
function plateLife(th) {
  if (gfxLite || REDUCE) return;
  var zi = zoneIndex(cam + VW / 2), t = S.t;
  // cloud shadow rolling across the whole view
  for (var c = 0; c < 2; c++) {
    var cw = 460 + c * 200;
    var cx0 = ((t * (10 + c * 7) + c * 300 - cam * 0.1) % (VW + cw * 2) + VW + cw * 2) % (VW + cw * 2) - cw;
    var cy = 34 + c * 64;
    var g = ctx.createRadialGradient(cx0 + cw / 2, cy, 6, cx0 + cw / 2, cy, cw * 0.52);
    g.addColorStop(0, 'rgba(6,9,20,' + (0.075 + c * 0.028) + ')'); g.addColorStop(1, 'rgba(6,9,20,0)');
    ctx.fillStyle = g; ctx.fillRect(cx0, 0, cw, H);
  }
  // the air thickens toward the ground
  var hz = ctx.createLinearGradient(0, GROUND - 130, 0, GROUND + 8);
  hz.addColorStop(0, 'rgba(255,236,208,0)'); hz.addColorStop(0.6, 'rgba(255,236,208,0.05)'); hz.addColorStop(1, 'rgba(255,236,208,0.11)');
  ctx.fillStyle = hz; ctx.fillRect(0, GROUND - 130, VW, 138);
  // dust, pollen, sand and spray hanging in the light
  ctx.fillStyle = LIFE_TINT[zi];
  for (var i = 0; i < MOTES.length; i++) {
    var m = MOTES[i];
    var x = ((m.x * (VW + 80) - cam * m.dp * 0.4 + t * m.sp * 7) % (VW + 80) + VW + 80) % (VW + 80) - 40;
    var y = m.y * H * 0.8 + Math.sin(t * 0.6 + m.ph) * 12 + Math.sin(t * 1.7 + m.sw) * 3;
    ctx.globalAlpha = 0.1 + 0.42 * (0.5 + 0.5 * Math.sin(t * 1.4 + m.ph));
    ctx.beginPath(); ctx.arc(x, y, m.r, 0, 6.283); ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (zi === 2) {                                   // the cave breathing with its own light
    var pu = 0.5 + 0.5 * Math.sin(t * 0.9);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var cg = ctx.createRadialGradient(VW * 0.48, H * 0.44, 20, VW * 0.48, H * 0.44, VW * 0.62);
    cg.addColorStop(0, 'rgba(110,215,255,' + (0.09 + 0.07 * pu) + ')'); cg.addColorStop(1, 'rgba(110,215,255,0)');
    ctx.fillStyle = cg; ctx.fillRect(0, 0, VW, H); ctx.restore();
  }
  if (zi === 3) {                                   // a storm you can feel coming
    if (Math.random() < 0.0032) lFlash = 1;
    if (lFlash > 0.01) {
      ctx.fillStyle = 'rgba(198,222,255,' + (0.16 * lFlash) + ')'; ctx.fillRect(0, 0, VW, H);
      lFlash *= 0.82;
    }
  }
  if (zi === 1) {                                   // dappled sun moving on the forest floor
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var d = 0; d < 5; d++) {
      var dx = ((d * 150 + t * 5 - cam * 0.25) % (VW + 200) + VW + 200) % (VW + 200) - 100;
      var dy = GROUND - 6 + Math.sin(t * 0.5 + d) * 3;
      ctx.globalAlpha = 0.05 + 0.03 * Math.sin(t * 0.9 + d * 2);
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath(); ctx.ellipse(dx, dy, 60, 9, 0, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.restore();
  }
}
// Grass and leaves close enough to the lens to be out of focus.
function drawNearLayer(th) {
  if (gfxLite) return;
  var zi = zoneIndex(cam + VW / 2), off = cam * 1.55, t = S.t;
  var ink = rgb(mixc(th.tree2, [0, 0, 0], 0.6));
  ctx.save();
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = ink;
  // grass on the shore, forest and cliff; wet stone instead of grass deep in the cave
  for (var i = Math.floor(off / 46) - 1; i < (off + VW) / 46 + 1; i++) {
    if (zi === 2) break;
    if (rnd(i * 5.7 + 3) > 0.52) continue;
    var bx = i * 46 - off + rnd(i * 2.1) * 22, hgt = 15 + rnd(i * 3.9) * 32, sway = Math.sin(t * 1.1 + i * 0.7) * 3.2;
    ctx.beginPath(); ctx.moveTo(bx - 5, H + 6);
    ctx.quadraticCurveTo(bx - 2 + sway * 0.5, H - hgt * 0.6, bx + sway, H - hgt);
    ctx.quadraticCurveTo(bx + 3 + sway * 0.5, H - hgt * 0.6, bx + 6, H + 6);
    ctx.closePath(); ctx.fill();
  }
  if (zi === 2) {
    ctx.fillStyle = rgb(mixc([40, 46, 58], [0, 0, 0], 0.55));
    for (var q = Math.floor(off / 130) - 1; q < (off + VW) / 130 + 1; q++) {
      var qx = q * 130 - off + rnd(q * 6.2) * 60, qw = 34 + rnd(q * 2.8) * 46;
      ctx.beginPath(); ctx.ellipse(qx, H + 12, qw, 26 + rnd(q * 3.3) * 16, 0, Math.PI, 0); ctx.fill();
    }
  }
  if (zi !== 2 && th.fg > 0.05) {
    ctx.fillStyle = rgb(mixc(th.tree1, [0, 0, 0], 0.72));
    for (var j = Math.floor(off / 230) - 1; j < (off + VW) / 230 + 1; j++) {
      if (rnd(j * 13.3) > 0.46) continue;
      var lx = j * 230 - off + rnd(j * 4.4) * 90, sw2 = Math.sin(t * 0.8 + j) * 4;
      ctx.beginPath(); ctx.moveTo(lx, -8);
      ctx.quadraticCurveTo(lx + 28 + sw2, 30, lx + 50 + sw2, 72);
      ctx.quadraticCurveTo(lx + 14 + sw2, 28, lx + 10, -8);
      ctx.closePath(); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
// Small sounds that prove something is alive out there.
function chirp(f0, f1, dur, type, vol, delay) {
  if (muted || !audioInit() || !ac) return;
  try {
    var o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime + (delay || 0);
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.03, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(sfxGain || master); o.start(t0); o.stop(t0 + dur + 0.06);
  } catch (e) {}
}
var lifeSnd = 3;
function lifeTick(dt) {
  if (S.mode !== 'play' || muted || !ac) return;
  lifeSnd -= dt;
  if (lifeSnd > 0) return;
  lifeSnd = 3.4 + Math.random() * 6.5;
  var zi = zoneIndex(S.p.x), r = Math.random();
  if (zi === 0) {
    if (r < 0.6) { chirp(720, 1450, 0.18, 'sine', 0.045); chirp(880, 1180, 0.13, 'sine', 0.03, 0.21); }
    else noise(0.7, 380, 900, 'bandpass', 0.02, 0.7);
  } else if (zi === 1) {
    if (r < 0.55) { chirp(2100, 3100, 0.07, 'sine', 0.03); chirp(2400, 2900, 0.05, 'sine', 0.022, 0.1); }
    else if (r < 0.8) chirp(340, 250, 0.4, 'triangle', 0.03);
    else noise(0.5, 2600, 3200, 'bandpass', 0.018, 0.9);
  } else if (zi === 2) {
    if (r < 0.7) chirp(1500, 240, 0.14, 'sine', 0.05);
    else noise(0.9, 120, 60, 'lowpass', 0.035, 0.6);
  } else if (zi === 3) {
    if (r < 0.45) noise(1.7, 130, 55, 'lowpass', 0.05, 0.6);
    else noise(0.9, 500, 1100, 'bandpass', 0.028, 0.8);
  } else {
    if (r < 0.5) noise(1.1, 420, 900, 'bandpass', 0.035, 0.8);
    else if (r < 0.8) chirp(1150, 1600, 0.22, 'sine', 0.028);
    else chirp(700, 1300, 0.16, 'sine', 0.025);
  }
}

function render() {
  cam = S.cam;
  var shx = S.shake > 0 && !REDUCE ? (Math.random() - 0.5) * 7 * Math.min(1, S.shake * 3) : 0;
  var shy = S.shake > 0 && !REDUCE ? (Math.random() - 0.5) * 5 * Math.min(1, S.shake * 3) : 0;
  ctx.setTransform(SC, 0, 0, SC, shx * SC, shy * SC);
  var cx = cam + VW / 2, th = themeAt(cx), cave = caveAmt(cx);
  var artDrawn = drawBackdrop();
  plateLife(th);
  if (!artDrawn) {
    drawSky(th, cave);
    drawSea(th);
    drawFar(th);
    if (!gfxLite && cave < 0.7) hazeBand(mixc(th.skyB, th.far, 0.55), GROUND - 110, 130, 0.24);
    drawDistantTower(th);
    treeLayer(0.3, 230, 150, 'tree2', 1, th);
    if (!gfxLite && cave < 0.7) hazeBand(mixc(th.skyB, th.tree1, 0.5), GROUND - 95, 115, 0.17);
    treeLayer(0.6, 210, 190, 'tree1', 50, th);
  }
  if (!artDrawn) drawCaveWall(cave);
  drawGround(th);
  drawPlatforms(th);
  drawPool(th);
  drawObstacles(th);
  drawBridge();
  drawTutGate();
  drawCheckpoints();
  drawSecrets();
  drawTower();
  S.items.forEach(drawItem);
  barriers().forEach(function (b) { if (b.on && b.kind === 'vine') drawVines(b); });
  S.enemies.forEach(function (e) { if (e.dying > 0.2 || e.x - cam < -120 || e.x - cam > VW + 120) return; var big = e.type === 'boss' ? 54 : e.type === 'panther' ? 34 : e.type === 'boar' ? 28 : 18; if (e.type === 'bat') shadowAt(e.x, GROUND, 10, 0.18); else shadowAt(e.x, e.y, big, 0.4); });
  S.enemies.forEach(function (e) { if (e.type === 'boss' || e.type === 'panther') return; drawEnemy(e); });
  S.enemies.forEach(function (e) { if (e.type === 'boss' || e.type === 'panther') drawEnemy(e); });
  drawHunter();
  drawHazards();
  drawTie();
  if (S.mode === 'play' && S.p.rope && nearGate()) drawPrompt(S.p.x - cam, S.p.y - 84, touchMode ? 'Use' : 'E', 'Tie the rope');
  if (S.p.lantern && nearTower()) drawPrompt(S.p.x - cam, S.p.y - 84, touchMode ? 'Use' : 'E', 'Light the beacon');
  drawLanternFlight();
  S.spears.forEach(function (s) {
    ctx.save(); ctx.translate(s.x - cam, s.y); ctx.rotate(s.mode === 'stuck' ? (s.vx > 0 ? 0.5 : Math.PI - 0.5) : s.ang);
    ctx.globalAlpha = s.mode === 'stuck' ? Math.max(0, 1 - s.t / 0.8) : 1; drawSpearShape(40); ctx.restore();
  });
  ctx.globalAlpha = 1;
  S.parts.forEach(function (q) { ctx.globalAlpha = clamp(q.life / q.max, 0, 1); ctx.fillStyle = q.col; ctx.beginPath(); ctx.arc(q.x - cam, q.y, q.r, 0, Math.PI * 2); ctx.fill(); });
  ctx.globalAlpha = 1;
  drawAtmosphere(th, cave);
  // foreground tufts and leaves
  if (th.fg > 0.05) {
    var off = cam * 1.35;
    ctx.fillStyle = rgb(mixc(th.tree2, [0, 0, 0], 0.4));
    for (var i = Math.floor(off / 260) - 1; i < (off + VW) / 260 + 1; i++) {
      if (rnd(i * 17 + 5) > th.fg * 0.6) continue;
      var lx = i * 260 - off + rnd(i + 9) * 120;
      ctx.beginPath(); ctx.moveTo(lx, H + 2); ctx.quadraticCurveTo(lx + 10, H - 34 - rnd(i) * 26, lx + 36, H - 6 - rnd(i + 3) * 8); ctx.quadraticCurveTo(lx + 22, H - 8, lx + 40, H + 2); ctx.fill();
    }
  }
  // fireflies
  if (th.fire > 0.05) {
    flies.forEach(function (f) {
      var x = ((f.x - cam * 0.8 + Math.sin(S.t * 0.7 + f.ph) * 22) % (VW + 40) + VW + 40) % (VW + 40) - 20, y = f.y + Math.sin(S.t * 1.1 + f.ph) * 14;
      ctx.globalAlpha = th.fire * (0.4 + 0.6 * Math.abs(Math.sin(S.t * 2 + f.ph)));
      ctx.fillStyle = '#e9ff9a'; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
  drawNearLayer(th);
  // floating text
  S.floaters.forEach(function (f) {
    ctx.globalAlpha = clamp(1.1 - f.t, 0, 1); ctx.fillStyle = f.col; ctx.font = '400 15px "Lilita One", sans-serif'; ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 3; ctx.strokeText(f.text, f.x - cam, f.y); ctx.fillText(f.text, f.x - cam, f.y);
  });
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
  // cave darkness with light around the hunter and glowing things
  if (cave > 0.01) {
    var p = S.p;
    dctx.setTransform(1, 0, 0, 1, 0, 0); dctx.globalCompositeOperation = 'source-over'; dctx.clearRect(0, 0, dk.width, dk.height);
    dctx.fillStyle = 'rgba(1,3,5,' + (0.96 * cave) + ')'; dctx.fillRect(0, 0, dk.width, dk.height);
    dctx.setTransform(SC, 0, 0, SC, 0, 0); dctx.globalCompositeOperation = 'destination-out';
    var hole = function (x, y, r, a) { var g = dctx.createRadialGradient(x, y, r * 0.15, x, y, r); g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); dctx.fillStyle = g; dctx.fillRect(x - r, y - r, r * 2, r * 2); };
    var flick = 1 + 0.04 * Math.sin(S.t * 11);
    hole(p.x - cam, p.y - 30, (p.lantern ? 250 : 120) * flick, 1);
    S.items.forEach(function (it) { if (!it.got && it.type === 'lantern') hole(it.x - cam, it.y, 90, 0.95); });
    hole(POOL.x + POOL.w / 2 - cam, GROUND, 80, 0.7);
    S.enemies.forEach(function (e) { if (e.type === 'bat' && !e.dying) hole(e.x - cam, e.y - 8, 26, 0.6); });
    S.spears.forEach(function (s) { hole(s.x - cam, s.y, 30, 0.6); });
    S.falls.forEach(function (f) { hole(f.x - cam, f.state === 'warn' ? GROUND - 10 : f.y, 44, 0.8); });
    if (p.lantern) {
      ctx.globalCompositeOperation = 'lighter';
      var wg = ctx.createRadialGradient(p.x - cam, p.y - 30, 6, p.x - cam, p.y - 30, 230);
      wg.addColorStop(0, 'rgba(255,170,70,0.28)'); wg.addColorStop(1, 'rgba(255,170,70,0)');
      ctx.fillStyle = wg; ctx.fillRect(0, 0, VW, H); ctx.globalCompositeOperation = 'source-over';
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(dk, 0, 0); ctx.setTransform(SC, 0, 0, SC, shx * SC, shy * SC);
  }
  // colour grade: cool air up top, warm light near the horizon
  if (!gfxLite) {
    var grade = ctx.createLinearGradient(0, 0, 0, H);
    grade.addColorStop(0, 'rgba(48,74,168,0.10)');
    grade.addColorStop(0.55, 'rgba(255,196,130,0.045)');
    grade.addColorStop(1, 'rgba(26,10,46,0.11)');
    ctx.fillStyle = grade; ctx.fillRect(0, 0, VW, H);
  }
  // fixed film grain, laid over backdrop and props alike
  if (!gfxLite) {
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.55;
    ctx.fillStyle = grainTexture(); ctx.fillRect(0, 0, VW, H); ctx.restore();
  }
  // vignette and hit flash
  var vg = ctx.createRadialGradient(VW / 2, H / 2, H * 0.55, VW / 2, H / 2, VW * 0.65);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, H);
  if (S.p.inv > 1.0 && S.mode === 'play') { ctx.fillStyle = 'rgba(220,40,30,' + (S.p.inv - 1.0) * 0.9 + ')'; ctx.fillRect(0, 0, VW, H); }
  if (S.flash > 0) { ctx.fillStyle = 'rgba(255,240,190,' + Math.min(1, S.flash * 1.6) * (REDUCE ? 0.45 : 1) + ')'; ctx.fillRect(0, 0, VW, H); }
  if (S.blink > 0) { ctx.fillStyle = 'rgba(3,5,10,' + Math.min(1, S.blink) + ')'; ctx.fillRect(0, 0, VW, H); }
}

// Light shafts, mist, rain, lightning, sea foam and film grain.
var grain = document.createElement('canvas'); grain.width = grain.height = 96;
(function () { var g = grain.getContext('2d'), id = g.createImageData(96, 96); for (var i = 0; i < id.data.length; i += 4) { var v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } g.putImageData(id, 0, 0); })();
var rain = []; for (var ri = 0; ri < 110; ri++) rain.push({ x: Math.random() * 700, y: Math.random() * 380, l: 8 + Math.random() * 10, s: 380 + Math.random() * 260 });
function drawAtmosphere(th, cave) {
  var cx = cam + VW / 2, jung = sm((cx - 1300) / 300) * (1 - sm((cx - 3500) / 300));
  // sunbeams through the canopy
  if (jung > 0.02) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 5; i++) {
      var x = ((i * 190 + 40 - cam * 0.5) % (VW + 220) + VW + 220) % (VW + 220) - 60, sw = 0.6 + 0.4 * Math.sin(S.t * 0.4 + i * 2);
      var g = ctx.createLinearGradient(x, 0, x + 70, GROUND); g.addColorStop(0, 'rgba(255,240,170,' + 0.13 * jung * sw + ')'); g.addColorStop(1, 'rgba(255,240,170,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 34, 0); ctx.lineTo(x + 130, GROUND); ctx.lineTo(x + 62, GROUND); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  // ground mist: jungle, the chasm and the cave floor
  var mist = jung * 0.5 + sm((cx - 5100) / 200) * (1 - sm((cx - 5900) / 200)) * 0.8 + cave * 0.35;
  if (mist > 0.02) {
    for (var m = 0; m < 3; m++) {
      var mx = ((m * 330 - cam * (0.25 + m * 0.12) + S.t * (6 + m * 3)) % (VW + 360) + VW + 360) % (VW + 360) - 180;
      var mg = ctx.createRadialGradient(mx, GROUND - 6 - m * 4, 4, mx, GROUND - 6 - m * 4, 190);
      mg.addColorStop(0, 'rgba(200,220,215,' + 0.16 * mist + ')'); mg.addColorStop(1, 'rgba(200,220,215,0)');
      ctx.save(); ctx.translate(0, GROUND - 6 - m * 4); ctx.scale(1, 0.22); ctx.translate(0, -(GROUND - 6 - m * 4));
      ctx.fillStyle = mg; ctx.fillRect(mx - 190, GROUND - 200 - m * 4, 380, 400); ctx.restore();
    }
  }
  // beach foam along the water
  if (th.sea > 0.3 && cx < 1700) {
    ctx.globalAlpha = th.sea * 0.55;
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.6;
    for (var f = 0; f < 4; f++) {
      var fy = 262 + f * 7, off = Math.sin(S.t * 0.8 + f * 1.7) * 10;
      ctx.beginPath(); for (var fx = -20; fx <= VW + 20; fx += 20) { var yy = fy + Math.sin(fx * 0.05 + S.t * 1.3 + f) * 1.6; if (fx === -20) ctx.moveTo(fx + off, yy); else ctx.lineTo(fx + off, yy); } ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // storm: rain and lightning
  var sa = stormAmt(cx);
  if (sa > 0.02) {
    ctx.strokeStyle = 'rgba(190,210,235,' + 0.35 * sa + ')'; ctx.lineWidth = 1; ctx.beginPath();
    var dt2 = 1 / 60;
    for (var r = 0; r < rain.length; r++) {
      var q = rain[r]; q.y += q.s * dt2; q.x -= q.s * 0.28 * dt2;
      if (q.y > H) { q.y = -10; q.x = Math.random() * (VW + 120); } if (q.x < -20) q.x += VW + 120;
      ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - q.l * 0.28, q.y + q.l);
    }
    ctx.stroke();
    if (S.bolt > 0) { ctx.fillStyle = 'rgba(210,225,255,' + Math.min(0.45, S.bolt * (Math.random() > 0.6 ? 1.6 : 0.6)) * sa + ')'; ctx.fillRect(0, 0, VW, H); }
  }
  // film grain
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.07;
  var gx = (Math.random() * 96) | 0, gy2 = (Math.random() * 96) | 0;
  for (var yy2 = -gy2; yy2 < H; yy2 += 96) for (var xx = -gx; xx < VW; xx += 96) ctx.drawImage(grain, xx, yy2);
  ctx.restore();
}

