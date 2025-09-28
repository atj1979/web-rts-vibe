#!/usr/bin/env node
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const url = process.argv[2] || "https://localhost:5173/web-rts-vibe/";
const out = process.argv[3] || "screenshots/tank.png";

async function main() {
  const outDir = path.dirname(out);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const isHttps = url.startsWith("https:");
  const launchArgs = ["--no-sandbox", "--disable-setuid-sandbox"];
  if (isHttps) launchArgs.push("--ignore-certificate-errors");
  const browser = await puppeteer.launch({
    args: launchArgs,
    ignoreHTTPSErrors: !!isHttps,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900 });
  console.log("Navigating to", url);
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
  // wait a short time for three.js scene to initialize; optional selector wait
  try {
    await page.waitForSelector("canvas", { timeout: 10000 });
  } catch (e) {
    // ignore
  }
  await page.screenshot({ path: out, fullPage: false });
  await browser.close();
  console.log("Saved screenshot to", out);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
