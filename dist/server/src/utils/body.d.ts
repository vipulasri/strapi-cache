/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { Stream } from 'stream';
export declare const streamToBuffer: (stream: Stream) => Promise<Buffer>;
export declare const decompressBuffer: (buffer: Buffer, encoding?: string) => Promise<Buffer>;
export declare const decodeBufferToText: (buffer: Buffer) => string;
