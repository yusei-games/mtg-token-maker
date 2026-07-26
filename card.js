// カードの見た目（CSS）と HTML 生成。
// 印刷用HTMLは単体ファイルとして成立させたいので、CSSは文字列として持つ。

const CARD_CSS = `
.card {
  position: relative;
  box-sizing: border-box;
  width: 63mm;
  height: 88mm;
  padding: 2.4mm;
  border-radius: 3mm;
  background: #0d0d0d;
  color: #111;
  font-family: "Times New Roman", "Yu Mincho", "Hiragino Mincho ProN", serif;
  font-size: 2.9mm;
  line-height: 1.25;
  overflow: hidden;
}
.card-frame {
  display: flex;
  flex-direction: column;
  gap: 1mm;
  height: 100%;
  padding: 1.2mm;
  border-radius: 1.6mm;
  background: var(--frame, #b8b3ab);
}
.card-name,
.card-type {
  display: flex;
  align-items: center;
  min-height: 5.4mm;
  padding: 0 2mm;
  border: 0.25mm solid rgba(0, 0, 0, 0.45);
  border-radius: 1.2mm;
  background: rgba(255, 255, 255, 0.55);
  font-weight: bold;
  letter-spacing: 0.02em;
}
.card-name {
  font-size: 3.4mm;
}
.card-type {
  font-size: 2.8mm;
  white-space: nowrap;
  overflow: hidden;
}
.card-art {
  flex: 1 1 auto;
  border: 0.25mm solid rgba(0, 0, 0, 0.45);
  border-radius: 1.2mm;
  background: repeating-linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.35) 0 2mm,
    rgba(255, 255, 255, 0.15) 2mm 4mm
  );
}
.card-text {
  flex: 0 0 26mm;
  overflow: hidden;
  padding: 1.6mm 2mm;
  border: 0.25mm solid rgba(0, 0, 0, 0.45);
  border-radius: 1.2mm;
  background: rgba(255, 255, 255, 0.72);
  white-space: pre-wrap;
  word-break: break-word;
}
.card-pt {
  position: absolute;
  right: 4mm;
  bottom: 3.4mm;
  min-width: 12mm;
  padding: 0.6mm 0;
  border: 0.3mm solid rgba(0, 0, 0, 0.6);
  border-radius: 1.2mm;
  background: var(--frame, #b8b3ab);
  box-shadow: 0 0 0 0.4mm rgba(0, 0, 0, 0.35);
  font-size: 3.4mm;
  font-weight: bold;
  text-align: center;
}
`;

const PRINT_CSS = `
@page {
  size: A4 portrait;
  margin: 0;
}
html,
body {
  margin: 0;
  padding: 0;
  background: #f2f2f2;
}
.sheet {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(3, 63mm);
  grid-template-rows: repeat(3, 88mm);
  justify-content: center;
  align-content: center;
  gap: 1mm;
  width: 210mm;
  height: 297mm;
  margin: 0 auto;
  background: #fff;
}
@media screen {
  .sheet {
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
  }
}
@media print {
  html,
  body {
    background: #fff;
  }
  .sheet {
    box-shadow: none;
  }
}
`;

// 画像は9枚ぶん重複させないよう、CSS側で1回だけ定義する
function artCss(image) {
  if (!image || !/^data:image\//.test(image)) return '';
  return `
.card-art {
  background-image: url("${image}");
  background-size: cover;
  background-position: center;
}
`;
}

const COLOR_FRAMES = {
  W: '#f6f2d8',
  U: '#9fd0ee',
  B: '#a9a29d',
  R: '#f0a08a',
  G: '#9ecfad',
};

const COLOR_ORDER = ['W', 'U', 'B', 'R', 'G'];

const TYPE_LABELS = {
  land: '土地',
  artifact: 'アーティファクト',
  enchantment: 'エンチャント',
  creature: 'クリーチャー',
};

// 実際のカードのタイプ行に倣った並び順（例: アーティファクト・クリーチャー）
const TYPE_ORDER = ['land', 'artifact', 'enchantment', 'creature'];

function frameStyle(colors, cardTypes) {
  const sorted = COLOR_ORDER.filter((c) => colors.includes(c));

  if (sorted.length === 1) {
    return COLOR_FRAMES[sorted[0]];
  }
  if (sorted.length === 2) {
    return `linear-gradient(105deg, ${COLOR_FRAMES[sorted[0]]} 0%, ${COLOR_FRAMES[sorted[0]]} 38%, ${COLOR_FRAMES[sorted[1]]} 62%, ${COLOR_FRAMES[sorted[1]]} 100%)`;
  }
  if (sorted.length >= 3) {
    return '#d8c07a'; // 3色以上は金枠
  }
  // 無色
  if (cardTypes.includes('artifact')) return '#b9c2c8';
  if (cardTypes.includes('land')) return '#c8b295';
  return '#d5d0c8';
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function typeLine(data) {
  const types = TYPE_ORDER.filter((t) => data.cardTypes.includes(t)).map(
    (t) => TYPE_LABELS[t]
  );
  // 「伝説の」はタイプ列の頭に、中点を挟まずに付く（例: 伝説のアーティファクト・クリーチャー）
  const typeText = types.join('・');
  const withLegendary =
    data.legendary && typeText ? `伝説の${typeText}` : typeText;
  const base = ['トークン', withLegendary].filter(Boolean).join('・');
  const sub = data.subtype.trim();
  return sub ? `${base} — ${sub}` : base;
}

// タイプ行が使える横幅（mm）。カード幅63mmから枠とパディングと罫線を引いたもの。
const TYPE_LINE_WIDTH_MM = 51;
const TYPE_LINE_FONT_MM = 2.8;

// 半角は0.5em、全角は1emとみなして文字列の幅（em）を見積もる
function estimateEmWidth(text) {
  let em = 0;
  for (const ch of text) {
    em += /[\x20-\x7e\xa0-\xff]/.test(ch) ? 0.5 : 1;
  }
  return em;
}

// 1行に収まるところまでフォントサイズを縮める
function typeLineFontMm(text) {
  const em = estimateEmWidth(text);
  if (em === 0) return TYPE_LINE_FONT_MM;
  return Math.min(TYPE_LINE_FONT_MM, TYPE_LINE_WIDTH_MM / em);
}

// data: { name, colors[], legendary, cardTypes[], subtype, text, power, toughness }
function renderCard(data) {
  const frame = frameStyle(data.colors, data.cardTypes);
  const showPt = data.cardTypes.includes('creature');
  const line = typeLine(data);
  const pt = showPt
    ? `<div class="card-pt">${escapeHtml(data.power)}/${escapeHtml(data.toughness)}</div>`
    : '';

  return `<div class="card" style="--frame: ${frame}">
  <div class="card-frame">
    <div class="card-name">${escapeHtml(data.name)}</div>
    <div class="card-art"></div>
    <div class="card-type" style="font-size: ${typeLineFontMm(line).toFixed(2)}mm">${escapeHtml(line)}</div>
    <div class="card-text">${escapeHtml(data.text)}</div>
  </div>
  ${pt}
</div>`;
}

// A4に同じカードを9枚並べた、単体で完結する印刷用HTML
function buildPrintHtml(data) {
  const cards = Array.from({ length: 9 }, () => renderCard(data)).join('\n');
  const title = data.name.trim() || 'MTG Token';

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)} - 印刷用</title>
<style>${PRINT_CSS}${CARD_CSS}${artCss(data.image)}</style>
</head>
<body>
<div class="sheet">
${cards}
</div>
</body>
</html>
`;
}
