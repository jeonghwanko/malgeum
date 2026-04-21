import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generate() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setViewport({ width: 1024, height: 1024, deviceScaleFactor: 1 });

  const htmlPath = path.join(__dirname, "generate-icon.html");
  await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0" });

  // 메인 아이콘 (1024x1024)
  const outputPath = path.join(__dirname, "..", "assets", "images", "icon.png");
  await page.screenshot({ path: outputPath, type: "png" });
  console.log(`✅ icon.png saved → ${outputPath}`);

  await browser.close();
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
