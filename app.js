// プレビュー用にカードCSSを注入
const styleEl = document.createElement('style');
styleEl.textContent = CARD_CSS;
document.head.appendChild(styleEl);

// 画像はプレビュー用に別のstyle要素で当てる（カード9枚に重複させないため）
const artStyleEl = document.createElement('style');
document.head.appendChild(artStyleEl);

const form = document.getElementById('editor');
const preview = document.getElementById('preview');
const ptRow = document.getElementById('ptRow');
const imageInput = document.getElementById('image');

// 選択中の画像（data URL）。印刷用HTMLに埋め込むので縮小してから保持する。
let cardImage = '';

const MAX_IMAGE_PX = 900;

// 印刷用HTMLが巨大にならないよう、長辺900pxまで縮小してJPEGにする
function shrinkImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('画像を読み込めませんでした'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('画像を読み込めませんでした'));
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_PX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function collect() {
  const colors = Array.from(
    document.querySelectorAll('#colors input:checked')
  ).map((el) => el.value);

  const cardTypes = Array.from(
    document.querySelectorAll('#cardTypes input:checked')
  ).map((el) => el.value);

  return {
    name: document.getElementById('name').value,
    colors,
    legendary: document.getElementById('legendary').checked,
    cardTypes,
    subtype: document.getElementById('subtype').value,
    text: document.getElementById('text').value,
    power: document.getElementById('power').value,
    toughness: document.getElementById('toughness').value,
    image: cardImage,
  };
}

function update() {
  const data = collect();
  ptRow.hidden = !data.cardTypes.includes('creature');
  artStyleEl.textContent = artCss(data.image);
  preview.innerHTML = renderCard(data);
}

imageInput.addEventListener('change', async () => {
  const file = imageInput.files[0];
  if (!file) return;
  try {
    cardImage = await shrinkImage(file);
  } catch (err) {
    alert(err.message);
    cardImage = '';
  }
  update();
});

document.getElementById('clearImageBtn').addEventListener('click', () => {
  cardImage = '';
  imageInput.value = '';
  update();
});

function fileName(data) {
  const base = data.name.trim() || 'mtg-token';
  return `${base.replace(/[\\/:*?"<>|]/g, '_')}.html`;
}

document.getElementById('printBtn').addEventListener('click', () => {
  const html = buildPrintHtml(collect());
  const win = window.open('', '_blank');
  if (!win) {
    alert('ポップアップがブロックされました。ダウンロードをお使いください。');
    return;
  }
  win.document.write(html);
  win.document.close();
});

document.getElementById('downloadBtn').addEventListener('click', () => {
  const data = collect();
  const blob = new Blob([buildPrintHtml(data)], {
    type: 'text/html;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName(data);
  a.click();
  URL.revokeObjectURL(url);
});

// 名前→サブタイプの一方向連動。サブタイプを手で編集した時点で解除する。
const nameInput = document.getElementById('name');
const subtypeInput = document.getElementById('subtype');
const relinkBtn = document.getElementById('relinkBtn');
let subtypeLinked = true;

function syncSubtype() {
  if (!subtypeLinked) return;
  subtypeInput.value = nameInput.value;
}

function setSubtypeLinked(linked) {
  subtypeLinked = linked;
  relinkBtn.hidden = linked;
  subtypeInput.classList.toggle('linked', linked);
}

nameInput.addEventListener('input', syncSubtype);

subtypeInput.addEventListener('input', () => setSubtypeLinked(false));

relinkBtn.addEventListener('click', () => {
  setSubtypeLinked(true);
  syncSubtype();
  update();
});

setSubtypeLinked(true);
syncSubtype();

// オートコンプリート
const ALL_SUBTYPES = [
  ...SUBTYPES.creature,
  ...SUBTYPES.artifact,
  ...SUBTYPES.enchantment,
  ...SUBTYPES.land,
];

// サブタイプ候補は選択中のカードタイプに絞る（未選択なら全部）
function subtypeCandidates() {
  const types = collect().cardTypes;
  if (types.length === 0) return ALL_SUBTYPES;
  return types.flatMap((t) => SUBTYPES[t] || []);
}

attachAutocomplete(nameInput, () => ALL_SUBTYPES);
attachAutocomplete(subtypeInput, subtypeCandidates, { segmented: true });

form.addEventListener('input', update);
form.addEventListener('change', update);
update();
