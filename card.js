// カードの見た目（CSS）と HTML 生成。
// 印刷用HTMLは単体ファイルとして成立させたいので、CSSは文字列として持つ。

// 帯の文字サイズ（mm）。タイプ欄はカード名より少しだけ小さく、
// さらに1行に収まらないぶんだけそこから縮める。
const BAND_FONT_MM = 2.8;
const TYPE_FONT_MM = 2.5;
const PT_FONT_MM = 3;

// 無色のときの帯の枠色。P/T欄はカードの色に関係なくこの色で固定する。
const COLORLESS_EDGE = '#9a948a';

const CARD_CSS = `
/* 本物の日本語版カードの書体に近い系統を、無償のGoogle Fonts（SIL OFL）で再現する。
     カード名・タイプ行: モトヤアポロ（明朝の骨格でウロコなし） → Shippori Antique
     カードテキスト: DF中太丸ゴシック体（丸ゴシック） → Kosugi Maru
   読み込めない環境のためにOS標準フォントも後ろに並べておく。 */
.card {
  --font-title: "Shippori Antique", "Yu Mincho", "游明朝", YuMincho,
    "Hiragino Mincho ProN", "Noto Sans JP", "Yu Gothic UI", sans-serif;
  --font-body: "Kosugi Maru", "M PLUS Rounded 1c",
    "Hiragino Maru Gothic ProN", "Noto Sans JP", "Yu Gothic UI", Meiryo,
    sans-serif;
  position: relative;
  box-sizing: border-box;
  width: 63mm;
  height: 88mm;
  padding: 2.4mm;
  border-radius: 3mm;
  background: #0d0d0d;
  color: #111;
  font-family: var(--font-body);
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
/* 黒い罫線は影で内外に描き、border は太枠（グラデーション）に使う。
   内側 0.25mm の罫線 / 太枠 / 外側 1px の縁、の3層になる。
   光源は右上。外側の縁も内側の罫線も、上と右を明るく下と左を暗くして
   盛り上がって見えるようにする */
.card-name,
.card-type,
.card-text,
.card-pt {
  /* 指定した mm がそのまま外形になるようにして、中身の文字数では一切変化させない */
  box-sizing: border-box;
  flex: 0 0 auto;
  overflow: hidden;
  border: 0.45mm solid transparent;
  border-radius: 1.4mm;
  box-shadow:
    inset -0.25mm 0.25mm 0 rgba(255, 252, 240, 0.55),
    inset 0.25mm -0.25mm 0 rgba(0, 0, 0, 0.5),
    1px -1px 0 rgba(255, 252, 240, 0.9),
    -1px 1px 0 rgba(12, 10, 8, 0.85);
  background-origin: border-box;
  background-clip: padding-box, border-box;
}
.card-name,
.card-type {
  display: flex;
  align-items: center;
  /* 上下は文字と枠の間の余白 */
  padding: 0.6mm 2mm;
  background-image: linear-gradient(rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.55)),
    var(--band-frame, #cfcfcf);
  font-family: var(--font-title);
  font-size: ${BAND_FONT_MM}mm;
  letter-spacing: 0.02em;
}
.card-name {
  height: 5.4mm;
  justify-content: center;
  white-space: nowrap;
  background-image: var(--name-bg, #4a4a4a), var(--band-frame, #cfcfcf);
  color: #fff;
  text-shadow: 0 0.15mm 0.35mm rgba(0, 0, 0, 0.55);
}
.card-type {
  /* テキスト欄の上端を潜り込ませるので、こちらを前面に置く */
  position: relative;
  z-index: 1;
  /* カード名欄との間を空けて、タイプ欄以下をカード下端に寄せる */
  margin-top: auto;
  /* 長いタイプ行では文字だけ縮ませ、帯の高さは常にこの値 */
  height: 5mm;
  padding: 0.45mm 2mm;
  font-size: ${TYPE_FONT_MM}mm;
  white-space: nowrap;
  overflow: hidden;
}
.card-text {
  height: 24.7mm;
  /* gap 1mm を打ち消したうえで、上端の枠ごとタイプ欄の下に潜り込ませる。左右は少し内側に。
     下の余白は、縦幅を1行ぶん減らしたぶんタイプ欄ごと上に押し上げるためのもの */
  margin: -2mm 1.2mm 3.6mm;
  border-radius: 0;
  padding: 1.6mm 2mm;
  background-image: var(--text-bg, #f6f4f1), var(--band-frame, #cfcfcf);
  font-family: var(--font-body);
  font-weight: normal; /* Kosugi Maru は400のみ */
  white-space: pre-wrap;
  word-break: break-word;
}
.card-pt {
  position: absolute;
  right: 4mm;
  bottom: 4.8mm;
  /* 6/12 でも 1/1 でも同じ大きさ。文字は収まるようJS側で縮める */
  display: flex;
  align-items: center;
  justify-content: center;
  width: 11.4mm;
  height: 5mm;
  /* 面も枠も、無色カードのタイプ欄と同じ扱い
     （カードの色には染まらず、アーティファクト／土地／それ以外にだけ追随する） */
  background-image: linear-gradient(rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.55)),
    var(--pt-frame, linear-gradient(90deg, ${COLORLESS_EDGE} 0%, ${COLORLESS_EDGE} 100%));
  /* ここだけ内側の罫線を逆向きにして、面がへこんで見えるようにする */
  box-shadow:
    inset -0.25mm 0.25mm 0 rgba(0, 0, 0, 0.5),
    inset 0.25mm -0.25mm 0 rgba(255, 252, 240, 0.55),
    1px -1px 0 rgba(255, 252, 240, 0.9),
    -1px 1px 0 rgba(12, 10, 8, 0.85);
  font-family: var(--font-title);
  font-size: ${PT_FONT_MM}mm;
  white-space: nowrap;
  text-align: center;
}
`;

// 印刷用HTMLでも同じ書体になるようにWebフォントを読み込む。
// 印刷時にフォールバックで刷られないよう display=block（最大3秒待つ）。
const FONT_LINKS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kosugi+Maru&family=Shippori+Antique&display=block">`;

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

// 画像は9枚ぶん重複させないよう、CSS側で1回だけ定義する。
// カード全面（黒縁の内側いっぱい）の背景として敷く。
function artCss(image) {
  if (!image || !/^data:image\//.test(image)) return '';
  return `
.card-frame {
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

// 帯の背景色。各色 [端, 中央付近] の順。
// カード名欄は白文字なので中央付近を濃く、テキスト欄は黒文字なので全体を薄く。
const NAME_PALETTE = {
  colors: {
    W: ['#c9c9c9', '#3d3d3d'],
    U: ['#5b9fd6', '#123a5e'],
    B: ['#6a6a6d', '#121212'],
    R: ['#d97a5e', '#5f1a13'],
    G: ['#63b183', '#12402a'],
  },
  gold: ['#e0be6a', '#5c4412'],
  artifact: ['#a7b3bb', '#37414a'],
  land: ['#b39471', '#3f2f1e'],
  colorless: [COLORLESS_EDGE, '#36322c'],
};

const TEXT_PALETTE = {
  colors: {
    W: ['#e9e3cd', '#fbf9f0'],
    U: ['#c8e2f6', '#eff7fd'],
    B: ['#d6d1cb', '#f4f2ef'],
    R: ['#f6d4c8', '#fdf1ec'],
    G: ['#cbe9d6', '#eff9f3'],
  },
  gold: ['#efdfb2', '#fbf6e5'],
  artifact: ['#dae1e7', '#f3f6f9'],
  land: ['#e4d5be', '#f8f2e8'],
  colorless: ['#e0ddd6', '#f6f4f1'],
};

// 中央の色をどこまで広げるか
const BAND_CENTER_FROM = '35%';
const BAND_CENTER_TO = '65%';

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

// 端 → 中央付近 → 中央付近 → 端 の4色グラデーション。
// 2色のときは左半分を1色目、右半分を2色目が担当する。
function bandGradient(left, right) {
  return `linear-gradient(105deg, ${left[0]} 0%, ${left[1]} ${BAND_CENTER_FROM}, ${right[1]} ${BAND_CENTER_TO}, ${right[0]} 100%)`;
}

// 帯の左半分・右半分がそれぞれ使う色ペアを選ぶ
function bandPairs(colors, cardTypes, palette) {
  const sorted = COLOR_ORDER.filter((c) => colors.includes(c));

  if (sorted.length === 1) {
    const pair = palette.colors[sorted[0]];
    return [pair, pair];
  }
  if (sorted.length === 2) {
    return [palette.colors[sorted[0]], palette.colors[sorted[1]]];
  }
  if (sorted.length >= 3) {
    return [palette.gold, palette.gold];
  }
  const pair = cardTypes.includes('artifact')
    ? palette.artifact
    : cardTypes.includes('land')
      ? palette.land
      : palette.colorless;
  return [pair, pair];
}

function bandStyle(colors, cardTypes, palette) {
  const [left, right] = bandPairs(colors, cardTypes, palette);
  return bandGradient(left, right);
}

// 帯の外周の太枠。カード名欄の明るいほうの色を左から右へ流す（単色ならフラット）。
function bandFrameStyle(colors, cardTypes) {
  const [left, right] = bandPairs(colors, cardTypes, NAME_PALETTE);
  return `linear-gradient(90deg, ${left[0]} 0%, ${right[0]} 100%)`;
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

// 各欄で文字が使える横幅（mm）。カード幅63mmから枠とパディングと罫線を引いたもの。
const NAME_LINE_WIDTH_MM = 54.5;
const TYPE_LINE_WIDTH_MM = 51;
const PT_LINE_WIDTH_MM = 8.8;

// 半角は0.5em、全角は1emとみなして文字列の幅（em）を見積もる
function estimateEmWidth(text) {
  let em = 0;
  for (const ch of text) {
    em += /[\x20-\x7e\xa0-\xff]/.test(ch) ? 0.5 : 1;
  }
  return em;
}

// 指定幅に1行で収まるところまでフォントサイズを縮める。
// 字間（letter-spacing: 0.02em）のぶんも見込む。
function fitFontMm(text, widthMm, baseFontMm) {
  const em = estimateEmWidth(text) * 1.02;
  if (em === 0) return baseFontMm;
  return Math.min(baseFontMm, widthMm / em);
}

// data: { name, colors[], legendary, cardTypes[], subtype, text, power, toughness }
function renderCard(data) {
  const frame = frameStyle(data.colors, data.cardTypes);
  const nameBg = bandStyle(data.colors, data.cardTypes, NAME_PALETTE);
  const textBg = bandStyle(data.colors, data.cardTypes, TEXT_PALETTE);
  const bandFrame = bandFrameStyle(data.colors, data.cardTypes);
  // P/T欄はカードの色には染まらないが、無色としての色分け（アーティファクト等）には追随する
  const ptFrame = bandFrameStyle([], data.cardTypes);
  const showPt = data.cardTypes.includes('creature');
  const line = typeLine(data);
  const ptText = `${data.power}/${data.toughness}`;
  const pt = showPt
    ? `<div class="card-pt" style="font-size: ${fitFontMm(ptText, PT_LINE_WIDTH_MM, PT_FONT_MM).toFixed(2)}mm">${escapeHtml(ptText)}</div>`
    : '';

  return `<div class="card" style="--frame: ${frame}; --name-bg: ${nameBg}; --text-bg: ${textBg}; --band-frame: ${bandFrame}; --pt-frame: ${ptFrame}">
  <div class="card-frame">
    <div class="card-name" style="font-size: ${fitFontMm(data.name, NAME_LINE_WIDTH_MM, BAND_FONT_MM).toFixed(2)}mm">${escapeHtml(data.name)}</div>
    <div class="card-type" style="font-size: ${fitFontMm(line, TYPE_LINE_WIDTH_MM, TYPE_FONT_MM).toFixed(2)}mm">${escapeHtml(line)}</div>
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
${FONT_LINKS}
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
