const { test } = require('node:test');
const assert = require('node:assert/strict');
const setup = require('../TemplateData/viewport.js');

function fixture() {
  function element() {
    const classes = new Set();
    return { style: {}, attrs: {}, listeners: {}, classList: {
      toggle(name, value) { value ? classes.add(name) : classes.delete(name); },
      contains(name) { return classes.has(name); }
    }, setAttribute(name, value) { this.attrs[name] = value; },
    addEventListener(name, fn) { this.listeners[name] = fn; } };
  }
  const container = element(), canvas = element(), footer = element(), button = element();
  const elements = { '#unity-container': container, '#unity-canvas': canvas, '#unity-footer': footer, '#unity-fullscreen-button': button };
  const doc = { listeners: {}, querySelector: key => elements[key], addEventListener(name, fn) { this.listeners[name] = fn; } };
  const visualViewport = { width: 390, height: 650, offsetTop: 0, offsetLeft: 0, listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; } };
  const win = { innerWidth: 390, innerHeight: 720, visualViewport, addEventListener() {}, getComputedStyle: () => ({ paddingTop: '0', paddingBottom: '0', paddingLeft: '0', paddingRight: '0' }) };
  return { container, canvas, footer, button, doc, win, visualViewport, controller: setup(win, doc) };
}
function portrait(f) {
  const w = parseFloat(f.canvas.style.width), h = parseFloat(f.canvas.style.height);
  assert.ok(Math.abs(w / h - 9 / 16) < .003);
  assert.ok(w <= f.visualViewport.width && h + 44 <= f.visualViewport.height);
}
test('iPhone: missing fullscreen APIs expand and restore without throwing or replacing canvas', async () => {
  const f = fixture(), canvas = f.canvas;
  const initial = f.canvas.style.height;
  await f.controller.toggle();
  assert.equal(f.button.attrs['aria-pressed'], 'true');
  assert.equal(f.button.attrs['aria-label'], '元の表示に戻す');
  assert.ok(parseFloat(f.canvas.style.height) > parseFloat(initial));
  portrait(f);
  await f.controller.toggle();
  assert.equal(f.button.attrs['aria-pressed'], 'false');
  assert.equal(f.canvas, canvas);
  assert.equal(f.canvas.style.height, initial);
});
test('rejected Promise falls back without unhandled rejection', async () => {
  const f = fixture(); f.container.requestFullscreen = () => Promise.reject(new TypeError('not allowed'));
  await f.controller.toggle(); assert.equal(f.button.attrs['aria-pressed'], 'true'); portrait(f);
});
test('synchronous API exception falls back', async () => {
  const f = fixture(); f.container.requestFullscreen = () => { throw new TypeError('unsupported'); };
  await f.controller.toggle(); assert.equal(f.button.attrs['aria-pressed'], 'true');
});
test('disabled fullscreen is not called even if the function exists', async () => {
  const f = fixture(); let calls = 0; f.doc.fullscreenEnabled = false;
  f.container.requestFullscreen = () => { calls++; };
  await f.controller.toggle(); assert.equal(calls, 0); assert.equal(f.button.attrs['aria-pressed'], 'true');
});
for (const prefixed of [false, true]) test(`native enter, exit and browser Escape (${prefixed ? 'WebKit' : 'standard'})`, async () => {
  const f = fixture();
  const field = prefixed ? 'webkitFullscreenElement' : 'fullscreenElement';
  const event = prefixed ? 'webkitfullscreenchange' : 'fullscreenchange';
  f.container[prefixed ? 'webkitRequestFullscreen' : 'requestFullscreen'] = function () {
    assert.equal(this, f.container); f.doc[field] = f.container; f.doc.listeners[event]();
    return prefixed ? undefined : Promise.resolve();
  };
  f.doc[prefixed ? 'webkitExitFullscreen' : 'exitFullscreen'] = function () {
    assert.equal(this, f.doc); f.doc[field] = null; f.doc.listeners[event]();
    return Promise.resolve();
  };
  await f.controller.toggle(); assert.equal(f.doc[field], f.container);
  await f.controller.toggle(); assert.equal(f.button.attrs['aria-pressed'], 'false');
  await f.controller.toggle(); f.doc[field] = null; f.doc.listeners[event]();
  assert.equal(f.button.attrs['aria-pressed'], 'false');
});
test('exit rejection remains contained and exit button remains usable', async () => {
  const f = fixture(); f.doc.fullscreenElement = f.container;
  f.doc.exitFullscreen = () => Promise.reject(new Error('exit denied'));
  await f.controller.toggle(); assert.equal(f.button.attrs['aria-pressed'], 'true');
  f.doc.exitFullscreen = () => { f.doc.fullscreenElement = null; };
  await f.controller.toggle(); assert.equal(f.button.attrs['aria-pressed'], 'false');
});
test('rapid taps cannot issue multiple fullscreen requests', async () => {
  const f = fixture(); let calls = 0, finish;
  f.container.requestFullscreen = () => { calls++; return new Promise(resolve => finish = resolve); };
  const pending = f.controller.toggle(); await f.controller.toggle();
  assert.equal(calls, 1); finish(); await pending;
  await f.controller.toggle(); assert.equal(f.button.attrs['aria-pressed'], 'false');
});
test('Safari toolbar resize, landscape rotation and safe areas retain portrait and exit control', async () => {
  const f = fixture(); await f.controller.toggle();
  for (const [width, height] of [[390, 550], [390, 740], [844, 320]]) {
    Object.assign(f.visualViewport, { width, height });
    f.visualViewport.listeners.resize(); portrait(f);
  }
  f.win.getComputedStyle = () => ({ paddingTop: '20', paddingBottom: '34', paddingLeft: '40', paddingRight: '40' });
  f.controller.fit();
  assert.ok(parseFloat(f.canvas.style.height) + 44 + 54 <= f.visualViewport.height);
  f.doc.listeners.keydown({ key: 'Escape' });
  assert.equal(f.button.attrs['aria-pressed'], 'false');
});
