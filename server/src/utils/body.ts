import { Stream } from 'stream';
import { createGunzip, createBrotliDecompress, createInflate } from 'zlib';

export const streamToBuffer = (stream: Stream): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
};

export const decompressBuffer = async (buffer: Buffer, encoding?: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    let decompressStream;
    switch (encoding) {
      case 'gzip':
        decompressStream = createGunzip();
        break;
      case 'br':
        decompressStream = createBrotliDecompress();
        break;
      case 'deflate':
        decompressStream = createInflate();
        break;
      default:
        return resolve(buffer);
    }

    const chunks: Buffer[] = [];
    decompressStream.on('data', (chunk) => chunks.push(chunk));
    decompressStream.on('end', () => resolve(Buffer.concat(chunks)));
    decompressStream.on('error', reject);

    decompressStream.end(buffer);
  });
};

export const decodeBufferToText = (buffer: Buffer): string => {
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(buffer);
};
