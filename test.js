import { encode, decode, stats, toHex, fromHex } from './src/index.js';

const mcq = `
What is the capital of France?

A. London
B. Paris
C. Rome
D. Berlin
`;

console.log('Original:');
console.log(mcq);

const compressed = encode(mcq);

console.log('Compressed bytes:', compressed);

console.log('Compressed size:', compressed.length, 'bytes');

const decoded = decode(compressed);

console.log('Decoded:');

console.log(decoded);

if (decoded !== mcq) {
    throw new Error('Compression is NOT lossless!');
}

console.log('✓ Original and decoded text match');

console.log(stats(mcq, compressed));

const hex = toHex(compressed);

console.log('Hex:', hex);

const restored = fromHex(hex);

console.log('Hex decode:', decode(restored));
