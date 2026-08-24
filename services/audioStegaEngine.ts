/**
 * QuietSend Audio Steganography Engine
 * Supports 16-bit PCM RIFF WAV Carriers with AES-GCM-256 / ECDH Encryption
 * Embeds encrypted bitstreams into the Least Significant Bits (LSB) of audio samples.
 */

import { zeroFill } from './stegaEngine';
import { bytesToChunks, chunksToBytes } from './bitCodec';

export interface WavHeaderInfo {
  numChannels: number;
  sampleRate: number;
  byteRate: number;
  blockAlign: number;
  bitsPerSample: number;
  dataOffset: number;
  dataSize: number;
  totalSamples: number;
}

export interface AudioAcousticMetrics {
  snr: number;    // Signal to Noise Ratio (dB)
  psnr: number;   // Peak SNR (dB)
  mse: number;    // Mean Squared Error
  durationSec: number;
  sampleRate: number;
  channels: number;
}

/** Parse RIFF WAV header and validate 16-bit PCM format */
export function parseWavHeader(buffer: ArrayBuffer): { header: WavHeaderInfo; dataView: DataView } {
  if (buffer.byteLength < 44) {
    throw new Error('Invalid WAV file: buffer too small for RIFF header.');
  }

  const view = new DataView(buffer);

  // Check 'RIFF'
  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (riff !== 'RIFF') {
    throw new Error('Invalid WAV file: missing RIFF header.');
  }

  // Check 'WAVE'
  const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
  if (wave !== 'WAVE') {
    throw new Error('Invalid WAV file: missing WAVE format descriptor.');
  }

  let offset = 12;
  let fmtFound = false;
  let dataFound = false;

  let numChannels = 0;
  let sampleRate = 0;
  let byteRate = 0;
  let blockAlign = 0;
  let bitsPerSample = 0;
  let audioFormat = 0;

  let dataOffset = 0;
  let dataSize = 0;

  while (offset + 8 <= buffer.byteLength) {
    const chunkId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === 'fmt ') {
      if (chunkSize < 16) {
        throw new Error('Malformed WAV file: fmt chunk is truncated (< 16 bytes).');
      }
      fmtFound = true;
      audioFormat = view.getUint16(offset + 8, true);
      numChannels = view.getUint16(offset + 10, true);
      sampleRate = view.getUint32(offset + 12, true);
      byteRate = view.getUint32(offset + 16, true);
      blockAlign = view.getUint16(offset + 20, true);
      bitsPerSample = view.getUint16(offset + 22, true);

      if (audioFormat === 0xfffe && chunkSize >= 40 && offset + 34 <= buffer.byteLength) {
        audioFormat = view.getUint16(offset + 32, true);
      }
    } else if (chunkId === 'data') {
      dataFound = true;
      dataOffset = offset + 8;
      dataSize = Math.min(chunkSize, buffer.byteLength - dataOffset);
      break;
    }

    const paddedChunkSize = chunkSize + (chunkSize % 2);
    offset += 8 + paddedChunkSize;
  }

  if (!fmtFound || !dataFound) {
    throw new Error('Malformed WAV file: could not find a valid fmt or data chunk.');
  }

  if (audioFormat !== 1) {
    throw new Error('Unsupported WAV encoding: only uncompressed PCM is supported.');
  }

  if (bitsPerSample !== 16) {
    throw new Error(
      `Unsupported bit depth: ${bitsPerSample}-bit. QuietSend audio steganography requires 16-bit PCM WAV.`
    );
  }

  const expectedBlockAlign = (numChannels * bitsPerSample) / 8;
  if (blockAlign !== expectedBlockAlign) {
    throw new Error('Malformed WAV file: block alignment does not match channel count and bit depth.');
  }

  const bytesPerSample = bitsPerSample / 8;
  const totalSamples = Math.floor(dataSize / bytesPerSample);

  return {
    header: {
      numChannels,
      sampleRate,
      byteRate,
      blockAlign,
      bitsPerSample,
      dataOffset,
      dataSize,
      totalSamples,
    },
    dataView: view,
  };
}

/** Calculate byte capacity of WAV audio for 1-bit or 2-bit LSB injection */
export function calculateAudioCapacity(wavBuffer: ArrayBuffer, bitsPerSampleLSB = 2): number {
  try {
    const { header } = parseWavHeader(wavBuffer);
    const totalBits = header.totalSamples * bitsPerSampleLSB;
    const totalBytes = Math.floor(totalBits / 8);
    // Reserve 4 bytes for 32-bit length prefix
    return Math.max(0, totalBytes - 4);
  } catch {
    return 0;
  }
}

/**
 * Encode binary payload into 16-bit PCM WAV audio carrier using LSB substitution
 */
export async function encodeWavAudio(
  wavBuffer: ArrayBuffer,
  payload: Uint8Array,
  bitsPerSampleLSB = 2,
  onProgress?: (percent: number, status: string) => void
): Promise<Blob> {
  onProgress?.(15, 'Validating WAV audio stream...');
  const { header } = parseWavHeader(wavBuffer);

  const capacity = calculateAudioCapacity(wavBuffer, bitsPerSampleLSB);
  if (payload.length > capacity) {
    throw new Error(
      `Payload size (${payload.length.toLocaleString()} bytes) exceeds audio capacity (${capacity.toLocaleString()} bytes). Use a longer audio track or reduce payload size.`
    );
  }

  onProgress?.(35, 'Cloning PCM audio matrix...');
  const outBuf = wavBuffer.slice(0);
  const outView = new DataView(outBuf);

  // Stream format: [Length: 4 bytes LE][Payload Bytes]
  const stream = new Uint8Array(4 + payload.length);
  const streamView = new DataView(stream.buffer);
  streamView.setUint32(0, payload.length, true);
  stream.set(payload, 4);

  onProgress?.(60, 'Injecting cryptographic bitstream into audio samples...');
  const chunks = bytesToChunks(stream, bitsPerSampleLSB);
  const mask = bitsPerSampleLSB === 2 ? 0xfffc : 0xfffe;
  const numChunks = Math.min(chunks.length, header.totalSamples);
  const dataStart = header.dataOffset;
  const bytesPerSample = header.bitsPerSample / 8;

  if (header.bitsPerSample === 16 && (dataStart % 2 === 0)) {
    const pcm16 = new Int16Array(outBuf, dataStart, header.totalSamples);
    for (let i = 0; i < numChunks; i++) {
      pcm16[i] = (pcm16[i] & mask) | chunks[i];
    }
  } else {
    for (let i = 0; i < numChunks; i++) {
      const sampleOffset = dataStart + i * bytesPerSample;
      const sampleVal = outView.getInt16(sampleOffset, true) & 0xffff;
      outView.setInt16(sampleOffset, (sampleVal & mask) | chunks[i], true);
    }
  }

  onProgress?.(95, 'Synthesizing metadata-sanitized lossless WAV container...');
  zeroFill(stream);

  // Construct clean, standardized 44-byte RIFF PCM header + data chunk (stripping all LIST/INFO/ID3 tags)
  const cleanDataSize = header.totalSamples * (header.bitsPerSample / 8);
  const cleanTotalSize = 44 + cleanDataSize;
  const cleanBuf = new ArrayBuffer(cleanTotalSize);
  const cleanView = new DataView(cleanBuf);

  // 'RIFF' chunk
  cleanView.setUint32(0, 0x46464952, true); // 'RIFF'
  cleanView.setUint32(4, cleanTotalSize - 8, true);
  cleanView.setUint32(8, 0x45564157, true); // 'WAVE'

  // 'fmt ' chunk (16 bytes PCM)
  cleanView.setUint32(12, 0x20746d66, true); // 'fmt '
  cleanView.setUint32(16, 16, true);
  cleanView.setUint16(20, 1, true); // PCM format
  cleanView.setUint16(22, header.numChannels, true);
  cleanView.setUint32(24, header.sampleRate, true);
  cleanView.setUint32(28, header.byteRate, true);
  cleanView.setUint16(32, header.blockAlign, true);
  cleanView.setUint16(34, header.bitsPerSample, true);

  // 'data' chunk
  cleanView.setUint32(36, 0x61746164, true); // 'data'
  cleanView.setUint32(40, cleanDataSize, true);

  // Copy modified raw PCM sample bytes into clean buffer
  const sampleDataSrc = new Uint8Array(outBuf, header.dataOffset, cleanDataSize);
  const sampleDataDst = new Uint8Array(cleanBuf, 44, cleanDataSize);
  sampleDataDst.set(sampleDataSrc);

  return new Blob([cleanBuf], { type: 'audio/wav' });
}

/**
 * Extract binary payload from 16-bit PCM WAV audio carrier
 */
export async function decodeWavAudio(
  wavBuffer: ArrayBuffer,
  bitsPerSampleLSB = 2,
  onProgress?: (percent: number, status: string) => void
): Promise<Uint8Array> {
  onProgress?.(15, 'Scanning WAV audio header...');
  const { header, dataView } = parseWavHeader(wavBuffer);

  const bytesPerSample = header.bitsPerSample / 8;
  const dataStart = header.dataOffset;
  const bitsShift = bitsPerSampleLSB;

  onProgress?.(35, 'Reading audio bitstream length prefix...');
  const requiredSamplesForLen = Math.ceil(32 / bitsShift);
  const rawHeaderChunks = new Uint8Array(requiredSamplesForLen);
  const mask = (1 << bitsShift) - 1;

  if (header.bitsPerSample === 16 && (dataStart % 2 === 0)) {
    const pcm16 = new Int16Array(wavBuffer, dataStart, requiredSamplesForLen);
    for (let i = 0; i < requiredSamplesForLen; i++) {
      rawHeaderChunks[i] = pcm16[i] & mask;
    }
  } else {
    for (let i = 0; i < requiredSamplesForLen; i++) {
      rawHeaderChunks[i] = dataView.getInt16(dataStart + i * bytesPerSample, true) & mask;
    }
  }

  const lenBytes = chunksToBytes(rawHeaderChunks, 4, bitsShift);
  const lenView = new DataView(lenBytes.buffer);
  const payloadLen = lenView.getUint32(0, true);

  const maxPossible = Math.floor((header.totalSamples * bitsShift - 32) / 8);
  if (payloadLen === 0 || payloadLen > maxPossible) {
    throw new Error('No valid QuietSend steganographic payload detected in this audio file.');
  }

  onProgress?.(65, `Extracting ${payloadLen.toLocaleString()} bytes of audio payload...`);
  const totalBits = (4 + payloadLen) * 8;
  const totalSamplesNeeded = Math.ceil(totalBits / bitsShift);
  const payloadSamplesNeeded = totalSamplesNeeded - requiredSamplesForLen;

  if (totalSamplesNeeded > header.totalSamples) {
    throw new Error('Audio carrier stream truncated.');
  }

  const rawPayloadChunks = new Uint8Array(payloadSamplesNeeded);
  if (header.bitsPerSample === 16 && (dataStart % 2 === 0)) {
    const pcm16 = new Int16Array(wavBuffer, dataStart + requiredSamplesForLen * 2, payloadSamplesNeeded);
    for (let i = 0; i < payloadSamplesNeeded; i++) {
      rawPayloadChunks[i] = pcm16[i] & mask;
    }
  } else {
    for (let i = 0; i < payloadSamplesNeeded; i++) {
      const sampleOffset = dataStart + (requiredSamplesForLen + i) * bytesPerSample;
      rawPayloadChunks[i] = dataView.getInt16(sampleOffset, true) & mask;
    }
  }

  const out = chunksToBytes(rawPayloadChunks, payloadLen, bitsShift);
  onProgress?.(100, 'Audio extraction complete!');
  return out;
}

/** Calculate Acoustic SNR / PSNR and MSE between original and stego audio */
export function analyzeAudioAcoustics(origBuf: ArrayBuffer, modBuf: ArrayBuffer): AudioAcousticMetrics {
  const orig = parseWavHeader(origBuf);
  const mod = parseWavHeader(modBuf);

  const samples = Math.min(orig.header.totalSamples, mod.header.totalSamples);
  const bytesPerSample = orig.header.bitsPerSample / 8;

  let sumDiffSq = 0;
  let sumSignalSq = 0;

  for (let s = 0; s < samples; s++) {
    const offOrig = orig.header.dataOffset + s * bytesPerSample;
    const offMod = mod.header.dataOffset + s * bytesPerSample;

    const s1 = orig.header.bitsPerSample === 16
      ? orig.dataView.getInt16(offOrig, true)
      : orig.dataView.getUint8(offOrig);

    const s2 = mod.header.bitsPerSample === 16
      ? mod.dataView.getInt16(offMod, true)
      : mod.dataView.getUint8(offMod);

    const diff = s1 - s2;
    sumDiffSq += diff * diff;
    sumSignalSq += s1 * s1;
  }

  const mse = sumDiffSq / samples;
  const maxVal = orig.header.bitsPerSample === 16 ? 32767 : 255;
  const psnr = mse === 0 ? 120 : 10 * Math.log10((maxVal * maxVal) / mse);
  const snr = sumDiffSq === 0 ? 120 : 10 * Math.log10(sumSignalSq / sumDiffSq);
  const durationSec = samples / orig.header.sampleRate / orig.header.numChannels;

  return {
    snr,
    psnr,
    mse,
    durationSec,
    sampleRate: orig.header.sampleRate,
    channels: orig.header.numChannels,
  };
}
