import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf-8"));
const templateHtml     = fs.readFileSync(path.join(__dirname, "template.html"), "utf-8");
const punchlineHtml    = fs.readFileSync(path.join(__dirname, "template-punchline.html"), "utf-8");
const featureHtml      = fs.readFileSync(path.join(__dirname, "template-feature.html"), "utf-8");
const soulHtml         = fs.readFileSync(path.join(__dirname, "template-soul.html"), "utf-8");

const OUT_ANDROID = path.join(__dirname, "../../assets/market/android");
const OUT_IOS     = path.join(__dirname, "../../assets/market/ios");
const OUT_FEATURE = path.join(__dirname, "../../assets/market");

[OUT_ANDROID, OUT_IOS, OUT_FEATURE].forEach((d) => fs.mkdirSync(d, { recursive: true }));

// 폰트 인라인
const fontPath = path.resolve(__dirname, "../../assets/fonts/NanumPenScript-Regular.ttf");
const inlineFont = `data:font/truetype;base64,${fs.readFileSync(fontPath).toString("base64")}`;

function inlineScreenshot(relPath) {
  const abs = path.resolve(__dirname, relPath);
  if (!fs.existsSync(abs)) return null;
  const ext = path.extname(abs).slice(1).replace("jpg", "jpeg");
  return `data:image/${ext};base64,${fs.readFileSync(abs).toString("base64")}`;
}

async function renderSlide({ browser, html, width, height, outputPath }) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.setDefaultNavigationTimeout(60000);
  await page.setContent(html, { waitUntil: "load" });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: outputPath, type: "png" });
  await page.close();
}

function buildNormalHtml(slide, imgData) {
  return templateHtml
    .replace("{{COPY}}", slide.copy.replace(/\n/g, "<br>"))
    .replace("{{SUB}}", slide.sub ?? "")
    .replace("{{COPY_COLOR}}", slide.copyColor)
    .replace("{{BG_FROM}}", slide.bgGradient[0])
    .replace("{{BG_TO}}", slide.bgGradient[1])
    .replace("{{SCREENSHOT}}", imgData)
    .replace("{{FONT_PATH}}", inlineFont);
}

function buildPunchlineHtml(slide) {
  return punchlineHtml
    .replace("{{COPY}}", slide.copy.replace(/\n/g, "<br>"))
    .replace("{{SUB}}", (slide.sub ?? "").replace(/\n/g, "<br>"))
    .replace("{{EMOJI}}", slide.emoji ?? "")
    .replace("{{BADGE}}", slide.badge ?? "")
    .replace("{{COPY_COLOR}}", slide.copyColor)
    .replace("{{BG_FROM}}", slide.bgGradient[0])
    .replace("{{BG_TO}}", slide.bgGradient[1])
    .replace("{{FONT_PATH}}", inlineFont);
}

function buildSoulHtml(slide, imgData) {
  return soulHtml
    .replace("{{COPY}}", slide.copy.replace(/\n/g, "<br>"))
    .replace("{{SUB}}", (slide.sub ?? "").replace(/\n/g, "<br>"))
    .replace("{{BADGE}}", slide.badge ?? "")
    .replace("{{COPY_COLOR}}", slide.copyColor)
    .replace("{{COPY_SIZE}}", slide.copySize ?? "12")
    .replace("{{OVERLAY_TOP}}", slide.overlayTop ?? "rgba(0,0,0,0.45)")
    .replace("{{OVERLAY_MID}}", slide.overlayMid ?? "rgba(0,0,0,0.35)")
    .replace("{{OVERLAY_BOT}}", slide.overlayBot ?? "rgba(0,0,0,0.7)")
    .replace("{{SCREENSHOT}}", imgData)
    .replace("{{FONT_PATH}}", inlineFont);
}

function buildFeatureHtml(slide, imgData) {
  const [from, mid, to] = slide.bgGradient.length === 3
    ? slide.bgGradient
    : [slide.bgGradient[0], slide.bgGradient[0], slide.bgGradient[1]];
  return featureHtml
    .replace("{{COPY}}", slide.copy.replace(/\n/g, "<br>"))
    .replace("{{SUB}}", slide.sub ?? "")
    .replace("{{BG_FROM}}", from)
    .replace("{{BG_MID}}", mid)
    .replace(/\{\{BG_TO\}\}/g, to)
    .replace("{{SCREENSHOT}}", imgData)
    .replace("{{FONT_PATH}}", inlineFont);
}

async function generate() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  // ── Feature Graphic (1024×500) ──────────────────────────
  const feat = config.feature;
  const featImg = inlineScreenshot(feat.screenshot);
  if (featImg) {
    const html = buildFeatureHtml(feat, featImg);
    const out  = path.join(OUT_FEATURE, `${feat.id}.png`);
    await renderSlide({ browser, html, width: 1024, height: 500, outputPath: out });
    console.log(`✅ Feature Graphic → ${feat.id}.png`);
  }

  // ── Android (1080×1920) + iOS (1290×2796) ───────────────
  for (const slide of config.slides) {
    const isPunchline = slide.type === "punchline";

    let androidHtml, iosHtml;

    if (isPunchline) {
      androidHtml = buildPunchlineHtml(slide);
      iosHtml     = buildPunchlineHtml(slide);
    } else {
      const imgData = inlineScreenshot(slide.screenshot);
      if (!imgData) {
        console.warn(`⚠️  스크린샷 없음: ${slide.screenshot}`);
        continue;
      }
      androidHtml = buildNormalHtml(slide, imgData);
      iosHtml     = buildNormalHtml(slide, imgData);
    }

    // Android
    await renderSlide({
      browser, html: androidHtml,
      width: 1080, height: 1920,
      outputPath: path.join(OUT_ANDROID, `${slide.id}.png`),
    });

    // iOS (1284×2778 — App Store 허용 사이즈)
    await renderSlide({
      browser, html: iosHtml,
      width: 1284, height: 2778,
      outputPath: path.join(OUT_IOS, `${slide.id}.png`),
    });

    console.log(`✅ ${slide.id}  (Android 1080×1920 + iOS 1290×2796)`);
  }

  // ── Soul Carousel (인스타 1080×1080) ─────────────────────
  const OUT_SOUL = path.join(__dirname, "../../assets/market/soul");
  fs.mkdirSync(OUT_SOUL, { recursive: true });

  for (const slide of (config.soul ?? [])) {
    let html;
    if (slide.type === "soul") {
      const imgData = inlineScreenshot(slide.screenshot);
      if (!imgData) { console.warn(`⚠️  스크린샷 없음: ${slide.screenshot}`); continue; }
      html = buildSoulHtml(slide, imgData);
    } else {
      html = buildPunchlineHtml(slide);
    }
    await renderSlide({
      browser, html,
      width: 1080, height: 1080,
      outputPath: path.join(OUT_SOUL, `${slide.id}.png`),
    });
    console.log(`✅ ${slide.id}  (1080×1080 soul)`);
  }

  await browser.close();
  console.log(`\n🎉 완료\n  Feature  → assets/market/\n  Android  → assets/market/android/\n  iOS      → assets/market/ios/\n  Soul     → assets/market/soul/`);
}

generate().catch(console.error);
