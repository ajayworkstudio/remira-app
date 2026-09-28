// Regenerates PNG app icons from the SVG sources. Run: node scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

mkdirSync("public/icons", { recursive: true });
const jobs = [
  ["public/icons/icon.svg", "public/icons/icon-192.png", 192],
  ["public/icons/icon.svg", "public/icons/icon-512.png", 512],
  ["public/icons/icon-maskable.svg", "public/icons/icon-maskable-512.png", 512],
  ["public/icons/icon-maskable.svg", "public/icons/apple-touch-icon.png", 180],
  ["public/icons/icon.svg", "public/icons/favicon-32.png", 32],
  ["public/icons/icon.svg", "public/icons/badge-72.png", 72],
];
for (const [src, out, size] of jobs) {
  await sharp(src, { density: 384 }).resize(size, size).png().toFile(out);
  console.log("wrote", out);
}
