import assert from 'node:assert/strict';
import test from 'node:test';
import { bundledFontFile, useDesignSystemFonts } from '../src/core/bundled-fonts.ts';
import { templatePackage } from '../src/core/workspace.ts';
import { woffTables, woffToSfnt } from '../src/core/woff.ts';

/* An independent font checksum: the words of a zero-padded copy, added modulo 2^32. */
const fontSum = function (bytes: Uint8Array): number {
  const padded = new Uint8Array(Math.ceil(bytes.length / 4) * 4);
  padded.set(bytes);
  const view = new DataView(padded.buffer);
  let total = 0;
  for (let index = 0; index < padded.length; index += 4) total = (total + view.getUint32(index)) % 2 ** 32;
  return total;
};

test('a WOFF font unwraps into a font file with a valid directory and checksums', () => {
  useDesignSystemFonts(templatePackage('design-system').dir);
  const file = bundledFontFile('Noto Sans', 600, 'latin', 'woff');
  const { data, extension } = woffToSfnt(file);
  const tables = woffTables(file);
  assert.equal(extension, '.ttf');
  const count = data.readUInt16BE(4);
  assert.equal(count, tables.size);
  assert.equal(data.readUInt16BE(6), 2 ** Math.floor(Math.log2(count)) * 16);
  assert.equal(data.readUInt16BE(8), Math.floor(Math.log2(count)));
  let previous = '';
  for (let index = 0; index < count; index++) {
    const entry = 12 + index * 16;
    const tag = data.toString('latin1', entry, entry + 4);
    assert.ok(tag > previous, 'tables are sorted by tag');
    previous = tag;
    const offset = data.readUInt32BE(entry + 8);
    const length = data.readUInt32BE(entry + 12);
    assert.equal(offset % 4, 0, tag + ' starts on a four-byte boundary');
    const body = Buffer.from(data.subarray(offset, offset + length));
    const original = Buffer.from(tables.get(tag) || []);
    // The head table is summed with its checksum adjustment set to zero.
    if (tag === 'head') {
      body.writeUInt32BE(0, 8);
      original.writeUInt32BE(0, 8);
    }
    assert.deepEqual(body, original, tag + ' is copied unchanged');
    assert.equal(fontSum(body), data.readUInt32BE(entry + 4), tag + ' checksum');
  }
  assert.equal(fontSum(data), 0xB1B0AFBA, 'the whole font sums to the magic number');
});
