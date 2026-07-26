// テキスト入力への簡易オートコンプリート。
// segmented: true のときは「・」区切りの最後の要素だけを補完対象にする。
function attachAutocomplete(input, getCandidates, options = {}) {
  const segmented = options.segmented === true;
  const limit = options.limit || 20;

  const wrap = document.createElement('div');
  wrap.className = 'ac';
  input.parentNode.insertBefore(wrap, input);
  wrap.appendChild(input);

  const list = document.createElement('ul');
  list.className = 'ac-list';
  list.hidden = true;
  wrap.appendChild(list);

  let items = [];
  let active = -1;

  function query() {
    const value = input.value;
    return segmented ? value.slice(value.lastIndexOf('・') + 1) : value;
  }

  function match(q) {
    if (!q) return [];
    const candidates = getCandidates();
    const head = candidates.filter((c) => c.startsWith(q));
    const rest = candidates.filter((c) => !c.startsWith(q) && c.includes(q));
    return [...head, ...rest].slice(0, limit);
  }

  function close() {
    list.hidden = true;
    active = -1;
  }

  function render() {
    if (items.length === 0) {
      close();
      return;
    }
    list.innerHTML = items
      .map((c, i) => `<li class="${i === active ? 'active' : ''}">${c}</li>`)
      .join('');
    list.hidden = false;
  }

  function choose(text) {
    if (segmented) {
      const cut = input.value.lastIndexOf('・');
      input.value = (cut < 0 ? '' : input.value.slice(0, cut + 1)) + text;
    } else {
      input.value = text;
    }
    close();
    // 連動やプレビュー更新は通常の入力と同じ経路で走らせる
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function refresh() {
    const q = query();
    // 候補そのものを打ち終えている状態でリストを出し続けない
    items = match(q).filter((c) => c !== q);
    active = -1;
    render();
  }

  input.addEventListener('input', refresh);
  input.addEventListener('focus', refresh);

  input.addEventListener('blur', () => {
    // クリックによる選択を先に処理させる
    setTimeout(close, 120);
  });

  input.addEventListener('keydown', (e) => {
    if (list.hidden || items.length === 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      active = (active + step + items.length) % items.length;
      render();
      const el = list.children[active];
      if (el) el.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      if (active >= 0) {
        e.preventDefault();
        choose(items[active]);
      }
    } else if (e.key === 'Escape') {
      close();
    }
  });

  list.addEventListener('mousedown', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    e.preventDefault();
    choose(li.textContent);
  });
}
