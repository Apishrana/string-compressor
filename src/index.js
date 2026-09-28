/*
 * String Compressor
 *
 * A small lossless string compressor.
 *
 * Pipeline:
 *
 *     String
 *       ↓
 *     UTF-8
 *       ↓
 *     LZ-style compression
 *       ↓
 *     Uint8Array
 *
 * No compression library is used.
 */

const WINDOW_SIZE = 4095;
const MAX_MATCH = 255;
const MIN_MATCH = 3;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function findMatch(data, position) {
    const start = Math.max(0, position - WINDOW_SIZE);

    let bestLength = 0;
    let bestDistance = 0;

    for (let i = start; i < position; i++) {
        let length = 0;

        while (
            length < MAX_MATCH &&
            position + length < data.length &&
            data[i + length] === data[position + length]
        ) {
            length++;
        }

        if (length >= MIN_MATCH && length > bestLength) {
            bestLength = length;
            bestDistance = position - i;

            if (length === MAX_MATCH) {
                break;
            }
        }
    }

    return {
        length: bestLength,
        distance: bestDistance,
    };
}

function compressBytes(data) {
    const output = [];

    let position = 0;

    while (position < data.length) {
        const match = findMatch(data, position);

        if (match.length >= MIN_MATCH) {
            output.push(1);

            output.push((match.distance >> 8) & 0xff);

            output.push(match.distance & 0xff);

            output.push(match.length);

            position += match.length;
        } else {
            output.push(0);
            output.push(data[position]);

            position++;
        }
    }

    return Uint8Array.from(output);
}

function decompressBytes(data) {
    const output = [];

    let position = 0;

    while (position < data.length) {
        const type = data[position++];

        if (type === 0) {
            output.push(data[position++]);

            continue;
        }

        if (type === 1) {
            const distance = (data[position++] << 8) | data[position++];

            const length = data[position++];

            const start = output.length - distance;

            for (let i = 0; i < length; i++) {
                output.push(output[start + i]);
            }

            continue;
        }

        throw new Error(`Invalid compression token: ${type}`);
    }

    return Uint8Array.from(output);
}

export function encode(text) {
    if (typeof text !== 'string') {
        throw new TypeError('encode() expects a string');
    }

    const bytes = textEncoder.encode(text);

    return compressBytes(bytes);
}

export function decode(data) {
    if (!(data instanceof Uint8Array)) {
        throw new TypeError('decode() expects a Uint8Array');
    }

    const bytes = decompressBytes(data);

    return textDecoder.decode(bytes);
}

export function toHex(data) {
    if (!(data instanceof Uint8Array)) {
        throw new TypeError('toHex() expects a Uint8Array');
    }

    return Array.from(data)
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}

export function fromHex(hex) {
    if (typeof hex !== 'string') {
        throw new TypeError('fromHex() expects a string');
    }

    if (hex.length % 2 !== 0) {
        throw new Error('Invalid hex string');
    }

    const output = new Uint8Array(hex.length / 2);

    for (let i = 0; i < output.length; i++) {
        output[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }

    return output;
}

export function stats(original, compressed) {
    const originalBytes = textEncoder.encode(original).length;

    const compressedBytes = compressed.length;

    const ratio = compressedBytes / originalBytes;

    const saved = 1 - ratio;

    return {
        originalBytes,
        compressedBytes,
        ratio,
        saved,
        savedPercent: saved * 100,
    };
}
