import sharp from "sharp";
import { readFileSync } from "node:fs";

// Generate OG image (1200×630 PNG) from SVG
const ogSvg = readFileSync("public/og-image.svg");
await sharp(ogSvg).resize(1200, 630).png().toFile("public/og-image.png");

// Generate Apple touch icon (180×180 PNG) from favicon SVG
const faviconSvg = readFileSync("public/favicon.svg");
await sharp(faviconSvg).resize(180, 180).png().toFile("public/apple-touch-icon.png");

console.log("Generated og-image.png and apple-touch-icon.png");
