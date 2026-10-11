import { spawnSync } from 'child_process';
import { existsSync, copyFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const ARTIFACTS_DIR = 'C:/Users/Jaswanth Reddy/.gemini/antigravity/brain/c48fc7aa-6f0b-4e8c-962c-0b791de158a5';
const APP_URL = 'http://localhost:3005/';

const VIEWPORTS = [
  { name: 'Mobile 320px (iPhone SE)', width: 320, height: 640, file: 'screenshot_320px.png' },
  { name: 'Mobile 390px (iPhone 14)', width: 390, height: 844, file: 'screenshot_390px.png' },
  { name: 'Tablet 768px (iPad)', width: 768, height: 1024, file: 'screenshot_768px.png' },
  { name: 'Desktop 1280px', width: 1280, height: 800, file: 'screenshot_1280px.png' },
];

console.log('Starting Headless Chromium Viewport Rendering & Layout Audit...');
console.log(`Target URL: ${APP_URL}`);

const tempProfileDir = join(tmpdir(), 'edge-audit-profile-' + Date.now());
mkdirSync(tempProfileDir, { recursive: true });

const results = [];

for (const vp of VIEWPORTS) {
  const tempShot = join(tmpdir(), vp.file);
  const targetShot = join(ARTIFACTS_DIR, vp.file);

  console.log(`\nTesting ${vp.name} [${vp.width}x${vp.height}]...`);

  const args = [
    '--headless=new',
    `--user-data-dir=${tempProfileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--hide-scrollbars',
    '--virtual-time-budget=4000',
    '--run-all-compositor-stages-before-draw',
    `--window-size=${vp.width},${vp.height}`,
    `--screenshot=${tempShot}`,
    APP_URL,
  ];

  const proc = spawnSync(EDGE_PATH, args, { encoding: 'utf8', timeout: 15000 });

  if (existsSync(tempShot)) {
    copyFileSync(tempShot, targetShot);
    const sizeKb = (readFileSync(targetShot).length / 1024).toFixed(1);
    console.log(`  Screenshot captured successfully: ${vp.file} (${sizeKb} KB)`);
    results.push({ viewport: vp.name, width: vp.width, height: vp.height, status: 'PASS', sizeKb: `${sizeKb} KB` });
  } else {
    console.error(`  Failed to capture screenshot for ${vp.name}`);
    results.push({ viewport: vp.name, width: vp.width, height: vp.height, status: 'FAIL', sizeKb: '0 KB' });
  }
}

// Check DOM structure rendered by Chromium
console.log('\nAuditing DOM structure rendered by Chromium...');
const domProc = spawnSync(
  EDGE_PATH,
  [
    '--headless=new',
    `--user-data-dir=${tempProfileDir}`,
    '--no-first-run',
    '--disable-gpu',
    '--window-size=375,812',
    '--dump-dom',
    APP_URL,
  ],
  { encoding: 'utf8', timeout: 15000 }
);

const domHtml = domProc.stdout || '';

const checks = [
  { name: 'Mobile bottom navigation present', pass: domHtml.includes('aria-label="Mobile Navigation"') },
  { name: 'Main content landmark present', pass: domHtml.includes('id="main-content"') },
  { name: 'Skip to content link present', pass: domHtml.includes('Skip to main content') },
  { name: 'Footer contentinfo present', pass: domHtml.includes('role="contentinfo"') },
  { name: 'Footer pb-24 clearance class applied', pass: domHtml.includes('pb-24') },
  { name: 'Search bar with accessible label present', pass: domHtml.includes('aria-label="Search across dashboard"') },
  { name: 'Available Liquid Cash metric card present', pass: domHtml.includes('Available Liquid Cash') },
  { name: 'Zero emojis in rendered HTML markup', pass: !/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(domHtml) },
];

console.log('\nDOM AUDIT RESULTS:');
for (const c of checks) {
  console.log(`  [${c.pass ? 'PASS' : 'FAIL'}] ${c.name}`);
}

const allChecksPass = checks.every((c) => c.pass);
const allShotsPass = results.every((r) => r.status === 'PASS');

console.log('\nSUMMARY TABLE:');
console.table(results);

if (allChecksPass && allShotsPass) {
  console.log('\nALL RESPONSIVENESS AND DOM CHECKS PASSED.');
  process.exit(0);
} else {
  console.error('\nSOME RESPONSIVENESS CHECKS FAILED.');
  process.exit(1);
}
