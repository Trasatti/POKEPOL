'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JS, fs, path, vm } = require('./load');

const files = fs.readdirSync(JS).filter(f => f.endsWith('.js'));

test('ha scripts em web/js', () => assert.ok(files.length > 0));

for (const f of files) {
  test(`web/js/${f} compila (new vm.Script)`, () => {
    assert.doesNotThrow(() => new vm.Script(fs.readFileSync(path.join(JS, f), 'utf8'), { filename: f }));
  });
}

test('game.js existe e compila', () => {
  assert.ok(files.includes('game.js'));
});

test('arquivos JSON de dados sao validos', () => {
  const WEB = path.join(JS, '..');
  for (const rel of ['data/balance.json', 'data/gyms.json', 'data/empresas.json', 'sprites/index.json']) {
    assert.doesNotThrow(() => JSON.parse(fs.readFileSync(path.join(WEB, rel), 'utf8')), rel);
  }
});

test('scripts de index.html existem em web/js', () => {
  const html = fs.readFileSync(path.join(JS, '..', 'index.html'), 'utf8');
  const refs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]).filter(s => !/^https?:/.test(s));
  for (const r of refs) assert.ok(fs.existsSync(path.join(JS, '..', r.split('?')[0])), `index.html referencia ${r}`);
});
