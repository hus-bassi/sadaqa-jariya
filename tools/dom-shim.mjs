/** DOM مصغّر كافٍ لتشغيل وحدات التطبيق خارج المتصفح (اختبار دخان) */

export function camel(s) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function makeClassList(el) {
  return {
    _l: new Set(),
    _set(list) { this._l = new Set(list); },
    add(...c) { c.forEach((x) => this._l.add(x)); el.attrs.class = [...this._l].join(' '); },
    remove(...c) { c.forEach((x) => this._l.delete(x)); el.attrs.class = [...this._l].join(' '); },
    toggle(c, f) { const on = f === undefined ? !this._l.has(c) : !!f; on ? this.add(c) : this.remove(c); return on; },
    contains(c) { return this._l.has(c); },
  };
}

export class El {
  constructor(tag = 'div') {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.attrs = {};
    this.dataset = {};
    this.classList = makeClassList(this);
    this.style = { cssText: '' };
    this._text = '';
    this.hidden = false;
    this._listeners = {};
    this.value = '';
    this.href = '';
    this.offsetWidth = 0;
    this.disabled = false;
  }
  get id() { return this.attrs.id || ''; }
  set id(v) { this.attrs.id = v; }
  get className() { return this.attrs.class || ''; }
  set className(v) { this.attrs.class = v; this.classList._set(String(v).split(/\s+/).filter(Boolean)); }
  set innerHTML(v) { this._html = v; if (v === '') this.children = []; }
  get innerHTML() { return this._html || ''; }
  set textContent(v) { this._text = String(v); }
  get textContent() { return this._text; }
  setAttribute(k, v) { this.attrs[k] = v; if (k.startsWith('data-')) this.dataset[camel(k.slice(5))] = v; }
  getAttribute(k) { return this.attrs[k] ?? null; }
  removeAttribute(k) { delete this.attrs[k]; }
  hasAttribute(k) { return k in this.attrs; }
  append(...c) { this.children.push(...c); }
  appendChild(c) { this.children.push(c); return c; }
  remove() {}
  addEventListener(t, f) { (this._listeners[t] ||= []).push(f); }
  removeEventListener(t, f) {
    const arr = this._listeners[t];
    if (arr) this._listeners[t] = arr.filter((x) => x !== f);
  }
  focus() {}
  click() { this.dispatch('click', { target: this, preventDefault() {}, stopPropagation() {} }); }
  dispatch(t, ev = {}) { (this._listeners[t] || []).forEach((f) => f(ev)); }
  contains() { return false; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  getBoundingClientRect() { return { top: 0, left: 0, width: 100, height: 40 }; }
  get scrollHeight() { return 2000; }
  scrollIntoView() {}
}

/** يحلّل HTML ويستخرج العناصر ذات المعرّفات (ما يهمّ التطبيق) */
export function buildDom(html) {
  const byId = new Map();
  const bodyHtml = html.slice(html.indexOf('<body'));
  const re = /<([a-zA-Z][\w-]*)\b([^>]*\sid="[^"]+"[^>]*)>/g;
  let m;
  while ((m = re.exec(bodyHtml)) !== null) {
    const tag = m[1];
    const attrsRaw = m[2];
    const idm = /\sid="([^"]+)"/.exec(attrsRaw);
    if (!idm) continue;
    const el = new El(tag);
    el.id = idm[1];
    const cm = /class="([^"]+)"/.exec(attrsRaw);
    if (cm) el.className = cm[1];
    el.hidden = /\shidden(\s|>|=)/.test(attrsRaw);
    const vm2 = /value="([^"]*)"/.exec(attrsRaw);
    if (vm2) el.value = vm2[1];
    byId.set(idm[1], el);
  }
  return byId;
}

/** يبني كائن document بسيطًا فوق byId */
export function makeDocument(byId) {
  const doc = {
    documentElement: new El('html'),
    body: new El('body'),
    readyState: 'complete',
    addEventListener() {},
    removeEventListener() {},
    querySelector(sel) { return sel.startsWith('#') ? byId.get(sel.slice(1)) || null : null; },
    querySelectorAll(sel) {
      if (sel.startsWith('#')) return [];
      const name = sel.replace(/^\./, '');
      const out = [];
      for (const el of byId.values()) if (el.classList.contains(name)) out.push(el);
      return out;
    },
    getElementById(id) { return byId.get(id) || null; },
    createElement: (t) => new El(t),
    createTextNode: (t) => ({ nodeValue: t }),
  };
  return doc;
}
