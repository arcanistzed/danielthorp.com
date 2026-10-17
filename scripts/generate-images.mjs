// Regenerates the raster icons and social card in public/ from their sources.
// The outputs are committed, so run `npm run images` after changing
// public/og-image.svg or src/assets/favicon.png.
import pngToIco from "png-to-ico";
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";

// OG image (1200×630 PNG) from SVG
const ogSvg = readFileSync("public/og-image.svg");
await sharp(ogSvg).resize(1200, 630).png().toFile("public/og-image.png");

// Icons from the full-size favicon source, which stays out of public/ so
// browsers never download it.
const favicon = "src/assets/favicon.png";
const icon = size => sharp(favicon).resize(size, size).png().toBuffer();

writeFileSync("public/favicon.ico", await pngToIco(await Promise.all([16, 32, 48].map(icon))));
await sharp(favicon).resize(180, 180).png().toFile("public/apple-touch-icon.png");
await sharp(favicon).resize(192, 192).png().toFile("public/icon-192.png");
await sharp(favicon).resize(512, 512).png().toFile("public/icon-512.png");

console.log("Generated og-image.png, favicon.ico, apple-touch-icon.png, icon-192.png, and icon-512.png");
