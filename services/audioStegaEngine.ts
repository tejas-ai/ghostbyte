/**
 * QuietSend Audio Steganography Engine
 * Supports 16-bit PCM RIFF WAV Carriers with AES-GCM-256 / ECDH Encryption
 * Embeds encrypted bitstreams into the Least Significant Bits (LSB) of audio samples.
 */

import { zeroFill } from './stegaEngine';

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

  // Search for 'fmt ' and 'data' chunks
  let pos = 12;
  let fmtFound = false;
  let dataFound = false;

  let audioFormat = 1; // 1 = PCM
  let numChannels = 2;
  let sampleRate = 44100;
  let byteRate = 176400;
  let blockAlign = 4;
  let bitsPerSample = 16;
  let dataOffset = 44;
  let dataSize = 0;

  while (pos + 8 <= buffer.byteLength) {
    const chunkId = String.fromCharCode(
      view.getUint8(pos),
      view.getUint8(pos + 1),
      view.getUint8(pos + 2),
      view.getUint8(pos + 3)
    );
    const chunkSize = view.getUint32(pos + 4, true);

    if (chunkId === 'fmt ' && chunkSize >= 16 && pos + 8 + 16 <= buffer.byteLength) {
      fmtFound = true;
      audioFormat = view.getUint16(pos + 8, true);
      numChannels = view.getUint16(pos + 10, true);
      sampleRate = view.getUint32(pos + 12, true);
      byteRate = view.getUint32(pos + 16, true);
      blockAlign = view.getUint16(pos + 20, true);
      bitsPerSample = view.getUint16(pos + 22, true);

      // WAVE_FORMAT_EXTENSIBLE stores the real format code in the extension.
      if (audioFormat === 0xfffe && chunkSize >= 40 && pos + 8 + 26 <= buffer.byteLength) {
        audioFormat = view.getUint16(pos + 8 + 24, true);
      }
    } else if (chunkId === 'data') {
      dataFound = true;
      dataOffset = pos + 8;
      dataSize = Math.min(chunkSize, buffer.byteLength - dataOffset);
      break;
    }

    // RIFF chunks are word-aligned: an odd-sized chunk is followed by a pad
    // byte that is not counted in chunkSize. Without this the walk desynced on
    // any file carrying an odd-length LIST/INFO chunk before `data`, and every
    // field after it was read from the wrong offset.
    const advance = 8 + chunkSize + (chunkSize & 1);
    if (advance <= 8) break; // zero or corrupt size: stop rather than spin
    pos += advance;
  }

  if (!fmtFound || !dataFound) {
    throw new Error('Malformed WAV file: could not find a valid fmt or data chunk.');
  }

  if (audioFormat !== 1) {
    throw new Error('Unsupported WAV encoding: only uncompressed PCM is supported.');
  }

  // Only 16-bit is implemented end to end. 8- and 24-bit used to pass this
  // check and then be mis-read: the encoder skipped 24-bit samples entirely and
  // the decoder read one byte of every three, producing a corrupt carrier with
  // no error and an unrecoverable payload.
  if (bitsPerSample !== 16) {
    throw new Error(
      `Unsupported bit depth: ${bitsPerSample}-bit. Convert the file to 16-bit PCM WAV first.`
    );
  }

  const expectedBlockAlign = numChannels * (bitsPerSample / 8);
  if (blockAlign !== expectedBlockAlign) {
    throw new Error('Malformed WAV file: block alignment does not match channel count and bit depth.');
  }

  if (numChannels < 1 || numChannels > 8) {
    throw new Error(`Unsupported channel count: ${numChannels}.`);
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
    // Reserve 32 bits (4 bytes) for length prefix
    return Math.max(0, Math.floor((totalBits - 32) / 8));
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
      `Payload size (${payload.length.toLocaleString()} B) exceeds audio carrier capacity (${capacity.toLocaleString()} B).`
    );
  }

  onProgress?.(35, 'Cloning PCM audio matrix...');
  // Create output copy
  const outBuf = wavBuffer.slice(0);
  const outView = new DataView(outBuf);

  // Stream format: [Length: 4 bytes LE][Payload Bytes]
  const stream = new Uint8Array(4 + payload.length);
  const streamView = new DataView(stream.buffer);
  streamView.setUint32(0, payload.length, true);
  stream.set(payload, 4);

  onProgress?.(60, 'Injecting cryptographic bitstream into audio samples...');
  const totalBits = stream.length * 8;
  const mask = bitsPerSampleLSB === 2 ? 0xfffc : 0xfffe;
  const bitsShift = bitsPerSampleLSB;

  let bitIdx = 0;
  const dataStart = header.dataOffset;
  const bytesPerSample = header.bitsPerSample / 8;

  for (let s = 0; s < header.totalSamples && bitIdx < totalBits; s++) {
    const sampleOffset = dataStart + s * bytesPerSample;
    let sampleVal = 0;

    if (header.bitsPerSample === 16) {
      sampleVal = outView.getInt16(sampleOffset, true);
    } else if (header.bitsPerSample === 8) {
      sampleVal = outView.getUint8(sampleOffset);
    } else {
      continue;
    }

    // Extract next N bits from stream
    let chunk = 0;
    for (let b = 0; b < bitsShift; b++) {
      const currBit = bitIdx + b;
      if (currBit < totalBits) {
        const byteIdx = currBit >> 3;
        const bitInByte = 7 - (currBit & 7);
        const bitVal = (stream[byteIdx] >> bitInByte) & 1;
        chunk = (chunk << 1) | bitVal;
      } else {
        chunk = chunk << 1;
      }
    }
    bitIdx += bitsShift;

    // Inject into sample LSB
    if (header.bitsPerSample === 16) {
      const unsignedVal = sampleVal & 0xffff;
      const modUnsigned = (unsignedVal & mask) | chunk;
      outView.setInt16(sampleOffset, modUnsigned, true);
    } else if (header.bitsPerSample === 8) {
      const modVal = (sampleVal & mask) | chunk;
      outView.setUint8(sampleOffset, modVal);
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
  // Read first 32 bits (4 bytes) to determine payload length
  const headerChunks: number[] = [];
  const requiredSamplesForLen = Math.ceil(32 / bitsShift);

  for (let s = 0; s < requiredSamplesForLen && s < header.totalSamples; s++) {
    const sampleOffset = dataStart + s * bytesPerSample;
    let sampleVal = dataView.getInt16(sampleOffset, true) & 0xffff;

    const chunk = sampleVal & ((1 << bitsShift) - 1);
    headerChunks.push(chunk);
  }

  // Convert chunks to 32-bit integer LE
  const lenBytes = new Uint8Array(4);
  let bitPos = 0;
  for (let i = 0; i < headerChunks.length && bitPos < 32; i++) {
    const chunk = headerChunks[i];
    for (let b = 0; b < bitsShift && bitPos < 32; b++) {
      const bitVal = (chunk >> (bitsShift - 1 - b)) & 1;
      const byteIdx = bitPos >> 3;
      const bitInByte = 7 - (bitPos & 7);
      lenBytes[byteIdx] |= (bitVal << bitInByte);
      bitPos++;
    }
  }

  const lenView = new DataView(lenBytes.buffer);
  const payloadLen = lenView.getUint32(0, true);

  const maxPossible = Math.floor((header.totalSamples * bitsShift - 32) / 8);
  if (payloadLen === 0 || payloadLen > maxPossible) {
    throw new Error('No valid QuietSend steganographic payload detected in this audio file.');
  }

  onProgress?.(65, `Extracting ${payloadLen.toLocaleString()} bytes of audio payload...`);
  const totalBits = (4 + payloadLen) * 8;
  const totalSamplesNeeded = Math.ceil(totalBits / bitsShift);

  if (totalSamplesNeeded > header.totalSamples) {
    throw new Error('Audio carrier stream truncated.');
  }

  const out = new Uint8Array(payloadLen);
  let payloadBitPos = 0;

  for (let s = requiredSamplesForLen; s < totalSamplesNeeded; s++) {
    const sampleOffset = dataStart + s * bytesPerSample;
    const sampleVal = dataView.getInt16(sampleOffset, true) & 0xffff;

    const chunk = sampleVal & ((1 << bitsShift) - 1);

    for (let b = 0; b < bitsShift && payloadBitPos < payloadLen * 8; b++) {
      const bitVal = (chunk >> (bitsShift - 1 - b)) & 1;
      const byteIdx = payloadBitPos >> 3;
      const bitInByte = 7 - (payloadBitPos & 7);
      out[byteIdx] |= (bitVal << bitInByte);
      payloadBitPos++;
    }
  }

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
