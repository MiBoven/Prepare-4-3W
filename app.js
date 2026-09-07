// ======================================================================
// Theme
// ======================================================================
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
function setTheme(t) {
  root.setAttribute('data-theme', t);
  localStorage.setItem('prepare4w-theme', t);
  themeToggle.textContent = t === 'dark' ? '◐' : '◑';
}
setTheme(localStorage.getItem('prepare4w-theme') || 'dark');
themeToggle.addEventListener('click', () => {
  setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});

// ======================================================================
// Fullscreen
// ======================================================================
document.getElementById('fullscreenToggle').addEventListener('click', () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen().catch(() => {});
  }
});

// ======================================================================
// Menu dropdown
// ======================================================================
const menuToggle = document.getElementById('menuToggle');
const dropdown = document.getElementById('dropdown');
menuToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
});
document.addEventListener('click', () => { dropdown.style.display = 'none'; });

// ======================================================================
// View routing (home <-> favicon tool)
// ======================================================================
const homeView = document.getElementById('homeView');
const faviconView = document.getElementById('faviconView');
const homeLink = document.getElementById('homeLink');

function showHome() {
  faviconView.hidden = true;
  homeView.hidden = false;
}
function showFavicon() {
  homeView.hidden = true;
  faviconView.hidden = false;
}
document.getElementById('openFavicon').addEventListener('click', showFavicon);
document.getElementById('backBtn').addEventListener('click', showHome);
homeLink.addEventListener('click', (e) => { e.preventDefault(); showHome(); });

// ======================================================================
// Favicon tool: state
// ======================================================================
const drop = document.getElementById('drop');
const fileInput = document.getElementById('fileInput');
const cropCard = document.getElementById('cropCard');
const cropStage = document.getElementById('cropStage');
const sourceImg = document.getElementById('sourceImg');
const cropBox = document.getElementById('cropBox');
const cropHint = document.getElementById('cropHint');
const optionsCard = document.getElementById('optionsCard');
const generateBtn = document.getElementById('generateBtn');
const sizeWarning = document.getElementById('sizeWarning');
const resultButtons = document.getElementById('resultButtons');
const resultList = document.getElementById('resultList');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const zipBtn = document.getElementById('zipBtn');

const MIN_RECOMMENDED = 512;
let naturalWidth = 0;
let naturalHeight = 0;
let generatedFiles = []; // { name, blob }

// ---------- Option checkboxes + localStorage ----------
const optionIds = ['opt-ico', 'opt-16', 'opt-32', 'opt-apple', 'opt-192', 'opt-512', 'opt-manifest'];
const OPTIONS_KEY = 'prepare4w-favicon-options';

function loadOptions() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(OPTIONS_KEY) || '{}'); } catch (e) { saved = {}; }
  optionIds.forEach(id => {
    if (id in saved) document.getElementById(id).checked = saved[id];
  });
  applyManifestLock();
}
function saveOptions() {
  const state = {};
  optionIds.forEach(id => { state[id] = document.getElementById(id).checked; });
  localStorage.setItem(OPTIONS_KEY, JSON.stringify(state));
}
function applyManifestLock() {
  const manifestChecked = document.getElementById('opt-manifest').checked;
  const opt192 = document.getElementById('opt-192');
  const opt512 = document.getElementById('opt-512');
  if (manifestChecked) {
    opt192.checked = true;
    opt512.checked = true;
  }
  opt192.disabled = manifestChecked;
  opt512.disabled = manifestChecked;
  opt192.closest('.opt-row').classList.toggle('locked', manifestChecked);
  opt512.closest('.opt-row').classList.toggle('locked', manifestChecked);
}
optionIds.forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    applyManifestLock();
    saveOptions();
  });
});
loadOptions();

// ---------- File loading ----------
drop.addEventListener('click', () => fileInput.click());
['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => {
  e.preventDefault(); drop.classList.add('drag');
}));
['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => {
  e.preventDefault(); drop.classList.remove('drag');
}));
drop.addEventListener('drop', e => {
  if (e.dataTransfer.files[0]) loadImageFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', e => {
  if (e.target.files[0]) loadImageFile(e.target.files[0]);
  fileInput.value = '';
});

function loadImageFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please choose an image file.');
    return;
  }
  const url = URL.createObjectURL(file);
  sourceImg.onload = () => {
    naturalWidth = sourceImg.naturalWidth;
    naturalHeight = sourceImg.naturalHeight;
    cropCard.hidden = false;
    optionsCard.hidden = false;
    generateBtn.hidden = false;
    resultButtons.hidden = true;
    resultList.innerHTML = '';
    sizeWarning.hidden = true;
    generatedFiles = [];
    // Give the browser a tick to lay out the image before measuring it
    requestAnimationFrame(initCropBox);
  };
  sourceImg.src = url;
}

// ---------- Crop box: init, drag, resize ----------
function initCropBox() {
  const stageW = cropStage.clientWidth;
  const stageH = sourceImg.clientHeight;
  const size = Math.round(Math.min(stageW, stageH) * 0.8);
  const left = Math.round((stageW - size) / 2);
  const top = Math.round((stageH - size) / 2);
  setCropBox(left, top, size);
}

function setCropBox(left, top, size) {
  cropBox.style.left = left + 'px';
  cropBox.style.top = top + 'px';
  cropBox.style.width = size + 'px';
  cropBox.style.height = size + 'px';
  updateCropHint();
}

function stageBounds() {
  return { w: cropStage.clientWidth, h: sourceImg.clientHeight };
}

function updateCropHint() {
  const scale = naturalWidth / cropStage.clientWidth;
  const naturalCropSize = Math.round(cropBox.offsetWidth * scale);
  cropHint.textContent = naturalCropSize < MIN_RECOMMENDED
    ? `Selected area ≈ ${naturalCropSize}×${naturalCropSize}px — smaller than the recommended ${MIN_RECOMMENDED}×${MIN_RECOMMENDED}px, larger icons will be upscaled.`
    : `Selected area ≈ ${naturalCropSize}×${naturalCropSize}px`;
}

let dragMode = null; // 'move' | 'nw' | 'ne' | 'sw' | 'se'
let dragStartX = 0, dragStartY = 0;
let boxStart = { left: 0, top: 0, size: 0 };
const MIN_BOX = 40;

function onPointerDown(mode) {
  return (e) => {
    dragMode = mode;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    boxStart = { left: cropBox.offsetLeft, top: cropBox.offsetTop, size: cropBox.offsetWidth };
    e.target.setPointerCapture(e.pointerId);
    e.stopPropagation();
    e.preventDefault();
  };
}
cropBox.addEventListener('pointerdown', onPointerDown('move'));
cropBox.querySelector('.handle-nw').addEventListener('pointerdown', onPointerDown('nw'));
cropBox.querySelector('.handle-ne').addEventListener('pointerdown', onPointerDown('ne'));
cropBox.querySelector('.handle-sw').addEventListener('pointerdown', onPointerDown('sw'));
cropBox.querySelector('.handle-se').addEventListener('pointerdown', onPointerDown('se'));

window.addEventListener('pointermove', (e) => {
  if (!dragMode) return;
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;
  const { w: stageW, h: stageH } = stageBounds();

  if (dragMode === 'move') {
    let left = boxStart.left + dx;
    let top = boxStart.top + dy;
    left = Math.max(0, Math.min(left, stageW - boxStart.size));
    top = Math.max(0, Math.min(top, stageH - boxStart.size));
    setCropBox(left, top, boxStart.size);
    return;
  }

  // Resize: keep the opposite corner anchored, keep the box square.
  let newSize;
  if (dragMode === 'se') newSize = boxStart.size + Math.max(dx, dy);
  else if (dragMode === 'nw') newSize = boxStart.size - Math.min(dx, dy);
  else if (dragMode === 'ne') newSize = boxStart.size + Math.max(dx, -dy);
  else if (dragMode === 'sw') newSize = boxStart.size + Math.max(-dx, dy);

  newSize = Math.max(MIN_BOX, newSize);

  let left = boxStart.left;
  let top = boxStart.top;
  if (dragMode === 'nw') { left = boxStart.left + boxStart.size - newSize; top = boxStart.top + boxStart.size - newSize; }
  else if (dragMode === 'ne') { top = boxStart.top + boxStart.size - newSize; }
  else if (dragMode === 'sw') { left = boxStart.left + boxStart.size - newSize; }

  // Clamp so the box never leaves the visible image
  newSize = Math.min(newSize, stageW - Math.max(0, left), stageH - Math.max(0, top));
  left = Math.max(0, Math.min(left, stageW - newSize));
  top = Math.max(0, Math.min(top, stageH - newSize));

  setCropBox(left, top, newSize);
});
window.addEventListener('pointerup', () => { dragMode = null; });

window.addEventListener('resize', () => {
  if (!cropCard.hidden) initCropBox();
});

// ======================================================================
// Generating icons
// ======================================================================
function cropToCanvas(size) {
  const scale = naturalWidth / cropStage.clientWidth;
  const sx = cropBox.offsetLeft * scale;
  const sy = cropBox.offsetTop * scale;
  const sSize = cropBox.offsetWidth * scale;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceImg, sx, sy, sSize, sSize, 0, 0, size, size);
  return canvas;
}

function canvasToPngBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

function blobToUint8Array(blob) {
  return blob.arrayBuffer().then(buf => new Uint8Array(buf));
}

// Build a modern (PNG-in-ICO) favicon.ico from a list of {size, bytes}
function buildIco(entries) {
  const count = entries.length;
  const headerSize = 6 + 16 * count;
  let dataSize = 0;
  entries.forEach(e => { dataSize += e.bytes.length; });
  const buf = new Uint8Array(headerSize + dataSize);
  const view = new DataView(buf.buffer);

  view.setUint16(0, 0, true);  // reserved
  view.setUint16(2, 1, true);  // type: icon
  view.setUint16(4, count, true);

  let offset = headerSize;
  entries.forEach((e, i) => {
    const entryOffset = 6 + i * 16;
    const dim = e.size >= 256 ? 0 : e.size; // 0 means 256px
    buf[entryOffset] = dim;       // width
    buf[entryOffset + 1] = dim;   // height
    buf[entryOffset + 2] = 0;     // color palette
    buf[entryOffset + 3] = 0;     // reserved
    view.setUint16(entryOffset + 4, 1, true);   // color planes
    view.setUint16(entryOffset + 6, 32, true);  // bits per pixel
    view.setUint32(entryOffset + 8, e.bytes.length, true);
    view.setUint32(entryOffset + 12, offset, true);
    buf.set(e.bytes, offset);
    offset += e.bytes.length;
  });
  return new Blob([buf], { type: 'image/x-icon' });
}

function buildManifest() {
  const manifest = {
    name: 'My App',
    short_name: 'My App',
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    theme_color: '#131313',
    background_color: '#131313',
    display: 'standalone'
  };
  return new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/manifest+json' });
}

generateBtn.addEventListener('click', async () => {
  generateBtn.disabled = true;
  try {
    await generateAll();
  } finally {
    generateBtn.disabled = false;
  }
});

async function generateAll() {
  generatedFiles = [];
  resultList.innerHTML = '';

  const scale = naturalWidth / cropStage.clientWidth;
  const naturalCropSize = Math.round(cropBox.offsetWidth * scale);
  if (naturalCropSize < MIN_RECOMMENDED) {
    sizeWarning.hidden = false;
    sizeWarning.textContent = `Your selected crop is about ${naturalCropSize}×${naturalCropSize}px, below the recommended ${MIN_RECOMMENDED}×${MIN_RECOMMENDED}px. Larger icons below have been upscaled and may look soft.`;
  } else {
    sizeWarning.hidden = true;
  }

  const wantIco = document.getElementById('opt-ico').checked;
  const want16 = document.getElementById('opt-16').checked;
  const want32 = document.getElementById('opt-32').checked;
  const wantApple = document.getElementById('opt-apple').checked;
  const want192 = document.getElementById('opt-192').checked;
  const want512 = document.getElementById('opt-512').checked;
  const wantManifest = document.getElementById('opt-manifest').checked;

  // Render every size we might need once, reuse for both individual files and the .ico
  const sizesNeeded = new Set();
  if (wantIco) { sizesNeeded.add(16); sizesNeeded.add(32); sizesNeeded.add(48); }
  if (want16) sizesNeeded.add(16);
  if (want32) sizesNeeded.add(32);
  if (wantApple) sizesNeeded.add(180);
  if (want192 || wantManifest) sizesNeeded.add(192);
  if (want512 || wantManifest) sizesNeeded.add(512);

  const pngBySize = {};
  for (const size of sizesNeeded) {
    const canvas = cropToCanvas(size);
    const blob = await canvasToPngBlob(canvas);
    pngBySize[size] = blob;
  }

  if (want16) generatedFiles.push({ name: 'favicon-16x16.png', blob: pngBySize[16] });
  if (want32) generatedFiles.push({ name: 'favicon-32x32.png', blob: pngBySize[32] });
  if (wantApple) generatedFiles.push({ name: 'apple-touch-icon.png', blob: pngBySize[180] });
  if (want192) generatedFiles.push({ name: 'android-chrome-192x192.png', blob: pngBySize[192] });
  if (want512) generatedFiles.push({ name: 'android-chrome-512x512.png', blob: pngBySize[512] });

  if (wantIco) {
    const entries = await Promise.all([16, 32, 48].map(async (size) => ({
      size, bytes: await blobToUint8Array(pngBySize[size])
    })));
    generatedFiles.push({ name: 'favicon.ico', blob: buildIco(entries) });
  }

  if (wantManifest) {
    generatedFiles.push({ name: 'site.webmanifest', blob: buildManifest() });
  }

  renderResults();
}

function renderResults() {
  resultList.innerHTML = '';
  generatedFiles.forEach(f => {
    const url = URL.createObjectURL(f.blob);
    const row = document.createElement('div');
    row.className = 'item';

    const thumb = document.createElement('img');
    thumb.src = f.name.endsWith('.ico') ? url : url; // browsers preview both fine as <img>
    thumb.alt = '';

    const info = document.createElement('div');
    info.className = 'info';
    const nameEl = document.createElement('div');
    nameEl.className = 'name';
    nameEl.textContent = f.name;
    const sizeEl = document.createElement('div');
    sizeEl.className = 'sizes';
    sizeEl.textContent = formatSize(f.blob.size);
    info.appendChild(nameEl);
    info.appendChild(sizeEl);

    const dl = document.createElement('a');
    dl.className = 'dl';
    dl.href = url;
    dl.download = f.name;
    dl.textContent = 'Save';

    row.appendChild(thumb);
    row.appendChild(info);
    row.appendChild(dl);
    resultList.appendChild(row);
  });
  resultButtons.hidden = generatedFiles.length === 0;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  return (bytes / 1024).toFixed(1) + ' KB';
}

downloadAllBtn.addEventListener('click', () => {
  generatedFiles.forEach((f, i) => {
    setTimeout(() => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(f.blob);
      a.download = f.name;
      a.click();
    }, i * 150);
  });
});

// ======================================================================
// Minimal ZIP writer (STORE method, no compression) — no external library
// needed for a handful of small icon files.
// ======================================================================
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function dosDateTime(date) {
  const time = ((date.getHours() & 0x1F) << 11) | ((date.getMinutes() & 0x3F) << 5) | ((date.getSeconds() >> 1) & 0x1F);
  const day = (((date.getFullYear() - 1980) & 0x7F) << 9) | (((date.getMonth() + 1) & 0xF) << 5) | (date.getDate() & 0x1F);
  return { time, day };
}

function writeString(bytes, offset, str) {
  for (let i = 0; i < str.length; i++) bytes[offset + i] = str.charCodeAt(i) & 0xFF;
}

async function buildZip(files) {
  const now = new Date();
  const { time, day } = dosDateTime(now);
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const data = new Uint8Array(await file.blob.arrayBuffer());
    const crc = crc32(data);

    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);       // version needed
    lv.setUint16(6, 0, true);        // flags
    lv.setUint16(8, 0, true);        // compression: store
    lv.setUint16(10, time, true);
    lv.setUint16(12, day, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true); // compressed size
    lv.setUint32(22, data.length, true); // uncompressed size
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);       // extra field length
    local.set(nameBytes, 30);

    localParts.push(local, data);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);       // version made by
    cv.setUint16(6, 20, true);       // version needed
    cv.setUint16(8, 0, true);        // flags
    cv.setUint16(10, 0, true);       // compression: store
    cv.setUint16(12, time, true);
    cv.setUint16(14, day, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);       // extra field length
    cv.setUint16(32, 0, true);       // comment length
    cv.setUint16(34, 0, true);       // disk number
    cv.setUint16(36, 0, true);       // internal attrs
    cv.setUint32(38, 0, true);       // external attrs
    cv.setUint32(42, offset, true);  // local header offset
    central.set(nameBytes, 46);

    centralParts.push(central);
    offset += local.length + data.length;
  }

  const centralStart = offset;
  let centralSize = 0;
  centralParts.forEach(p => { centralSize += p.length; });

  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, centralStart, true);
  ev.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, end], { type: 'application/zip' });
}

zipBtn.addEventListener('click', async () => {
  zipBtn.disabled = true;
  zipBtn.textContent = 'Zipping…';
  try {
    const zipBlob = await buildZip(generatedFiles);
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'favicons.zip';
    a.click();
  } finally {
    zipBtn.disabled = false;
    zipBtn.textContent = 'Download all as ZIP';
  }
});
