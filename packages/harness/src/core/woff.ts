/* WOFF 1.0, the wrapper Fontsource ships fonts in. The harness reads its tables
 * to measure text, and unwraps it into a plain font file for the renderer,
 * whose font stack reads neither WOFF nor WOFF2. */
'use strict';

const fs = require('node:fs') as typeof import('node:fs');
const zlib = require('node:zlib') as typeof import('node:zlib');

interface WoffTable {
  readonly checksum: number;
  readonly data: Buffer;
  readonly tag: string;
}

const readWoff = function (file: string): { flavor: number; tables: WoffTable[] } {
  const buffer = fs.readFileSync(file);
  if (buffer.toString('latin1', 0, 4) !== 'wOFF') throw new Error('not a WOFF font: ' + file);
  const tables: WoffTable[] = [];
  const count = buffer.readUInt16BE(12);
  for (let index = 0; index < count; index++) {
    const entry = 44 + index * 20;
    const offset = buffer.readUInt32BE(entry + 4);
    const stored = buffer.readUInt32BE(entry + 8);
    const original = buffer.readUInt32BE(entry + 12);
    const data = buffer.subarray(offset, offset + stored);
    tables.push({
      tag: buffer.toString('latin1', entry, entry + 4),
      checksum: buffer.readUInt32BE(entry + 16),
      data: stored < original ? zlib.inflateSync(data) : data,
    });
  }
  return { flavor: buffer.readUInt32BE(4), tables };
};

/* The sum of a buffer's big-endian 32-bit words, as a font checksum. */
const checksum = function (data: Buffer): number {
  let sum = 0;
  for (let offset = 0; offset < data.length; offset += 4) {
    const word = offset + 4 <= data.length
      ? data.readUInt32BE(offset)
      : Buffer.concat([data.subarray(offset), Buffer.alloc(4)]).readUInt32BE(0);
    sum = (sum + word) >>> 0;
  }
  return sum;
};

/** The decompressed tables of a WOFF file, by tag. */
export function woffTables(file: string): Map<string, Buffer> {
  return new Map(readWoff(file).tables.map((table) => [table.tag, table.data]));
}

/** The TrueType or OpenType font a WOFF file wraps, and the extension it takes. */
export function woffToSfnt(file: string): { data: Buffer; extension: '.otf' | '.ttf' } {
  const { flavor, tables } = readWoff(file);
  tables.sort((left, right) => (left.tag < right.tag ? -1 : left.tag > right.tag ? 1 : 0));
  const count = tables.length;
  const selector = Math.floor(Math.log2(count));
  const searchRange = 2 ** selector * 16;
  const header = Buffer.alloc(12 + count * 16);
  header.writeUInt32BE(flavor, 0);
  header.writeUInt16BE(count, 4);
  header.writeUInt16BE(searchRange, 6);
  header.writeUInt16BE(selector, 8);
  header.writeUInt16BE(count * 16 - searchRange, 10);
  const bodies: Buffer[] = [];
  let offset = header.length;
  tables.forEach((table, index) => {
    const entry = 12 + index * 16;
    header.write(table.tag, entry, 4, 'latin1');
    header.writeUInt32BE(table.checksum, entry + 4);
    header.writeUInt32BE(offset, entry + 8);
    header.writeUInt32BE(table.data.length, entry + 12);
    // Every table starts on a four-byte boundary.
    const padded = Buffer.alloc(Math.ceil(table.data.length / 4) * 4);
    table.data.copy(padded);
    bodies.push(padded);
    offset += padded.length;
  });
  const data = Buffer.concat([header, ...bodies]);
  // The whole-font checksum lives in head.checkSumAdjustment, which is zero while it is summed.
  const head = tables.findIndex((table) => table.tag === 'head');
  if (head >= 0) {
    const adjustment = data.readUInt32BE(12 + head * 16 + 8) + 8;
    data.writeUInt32BE(0, adjustment);
    data.writeUInt32BE((0xB1B0AFBA - checksum(data)) >>> 0, adjustment);
  }
  return { data, extension: flavor === 0x4F54544F ? '.otf' : '.ttf' };
}
