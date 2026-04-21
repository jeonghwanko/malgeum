#!/usr/bin/env node
/**
 * 위젯 전용 텍스처 리사이즈 스크립트
 * 원본 (~1.9MB) → 위젯용 (~80KB, 400×200px)
 *
 * Usage: node scripts/resize-widget-textures.js
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "..");

const ART_STYLES = ["vangogh", "monet", "klimt", "gauguin", "popart", "bauhaus", "ukiyo"];
const TEXTURES   = ["sunny", "cloudy", "rainy", "snowy", "stormy", "dusty"];

// Small 위젯: 2×2셀 → 약 200×200dp → 3x = 600px
// Medium 위젯: 4×2셀 → 약 400×200dp → 3x = 1200×600px
// 단일 사이즈로 커버: 600×300px (medium 기준, small은 크롭)
const W = 600;
const H = 300;
const QUALITY = 72;

const SRC_ART  = path.join(ROOT, "assets/textures/art");
const DST_ART  = path.join(ROOT, "assets/textures/widget");

const DEFAULT_MAP = {
  sunny:  "A01-sunny-day.jpg",
  cloudy: "A05-cloudy.jpg",
  rainy:  "A06-rainy.jpg",
  snowy:  "A08-snowy.jpg",
  stormy: "A07-thunderstorm.jpg",
  dusty:  "A10-fine-dust.jpg",
};
const SRC_DEFAULT = path.join(ROOT, "assets/malgeum/A");
const DST_DEFAULT = path.join(ROOT, "assets/textures/widget/default");

async function resize(src, dst) {
  await sharp(src)
    .resize(W, H, { fit: "cover", position: "centre" })
    .jpeg({ quality: QUALITY, progressive: true })
    .toFile(dst);
}

async function main() {
  let total = 0;
  let saved = 0;

  // 아트 스타일 7종 × 6 텍스처
  for (const style of ART_STYLES) {
    const dstDir = path.join(DST_ART, style);
    fs.mkdirSync(dstDir, { recursive: true });

    for (const tex of TEXTURES) {
      const src = path.join(SRC_ART, style, `${tex}.jpg`);
      const dst = path.join(dstDir, `${tex}.jpg`);
      if (!fs.existsSync(src)) { console.warn(`  ⚠ 없음: ${src}`); continue; }

      const srcSize = fs.statSync(src).size;
      await resize(src, dst);
      const dstSize = fs.statSync(dst).size;
      saved += srcSize - dstSize;
      total++;
      console.log(`  ✓ ${style}/${tex}.jpg  ${kb(srcSize)} → ${kb(dstSize)}`);
    }
  }

  // default (A 시리즈)
  fs.mkdirSync(DST_DEFAULT, { recursive: true });
  for (const [tex, file] of Object.entries(DEFAULT_MAP)) {
    const src = path.join(SRC_DEFAULT, file);
    const dst = path.join(DST_DEFAULT, `${tex}.jpg`);
    if (!fs.existsSync(src)) { console.warn(`  ⚠ 없음: ${src}`); continue; }

    const srcSize = fs.statSync(src).size;
    await resize(src, dst);
    const dstSize = fs.statSync(dst).size;
    saved += srcSize - dstSize;
    total++;
    console.log(`  ✓ default/${tex}.jpg  ${kb(srcSize)} → ${kb(dstSize)}`);
  }

  console.log(`\n✅ ${total}장 완료 — 절약: ${mb(saved)}`);
}

const kb = (b) => `${(b / 1024).toFixed(0)}KB`;
const mb = (b) => `${(b / 1024 / 1024).toFixed(1)}MB`;

main().catch((e) => { console.error(e); process.exit(1); });
