import pngToIco from "png-to-ico";
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";

// Generate OG image (1200×630 PNG) from SVG
const ogSvg = readFileSync("public/og-image.svg");
await sharp(ogSvg).resize(1200, 630).png().toFile("public/og-image.png");

// Generate favicon.ico and Apple touch icon from the raster favicon source
const faviconPng = "public/favicon.png";
writeFileSync("public/favicon.ico", await pngToIco(faviconPng));
await sharp(faviconPng).resize(180, 180).png().toFile("public/apple-touch-icon.png");

console.log("Generated og-image.png, favicon.ico, and apple-touch-icon.png");
