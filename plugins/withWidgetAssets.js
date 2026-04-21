/**
 * Expo config plugin: 위젯용 텍스처 이미지를 Android drawable-nodpi로 복사.
 * app.config.ts plugins에 "./plugins/withWidgetAssets" 추가하여 사용.
 */
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const TEXTURE_MAP = {
  "A01-sunny-day.jpg": "widget_bg_sunny.jpg",
  "A05-cloudy.jpg": "widget_bg_cloudy.jpg",
  "A06-rainy.jpg": "widget_bg_rainy.jpg",
  "A07-thunderstorm.jpg": "widget_bg_stormy.jpg",
  "A08-snowy.jpg": "widget_bg_snowy.jpg",
  "A10-fine-dust.jpg": "widget_bg_dusty.jpg",
};

function withWidgetAssets(config) {
  return withDangerousMod(config, [
    "android",
    async (c) => {
      const srcDir = path.join(c.modRequest.projectRoot, "assets", "malgeum", "A");
      const destDir = path.join(
        c.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
        "drawable-nodpi"
      );

      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      for (const [src, dest] of Object.entries(TEXTURE_MAP)) {
        const srcPath = path.join(srcDir, src);
        const destPath = path.join(destDir, dest);
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, destPath);
        }
      }

      return c;
    },
  ]);
}

module.exports = withWidgetAssets;
