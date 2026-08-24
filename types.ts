export type TabId = 'encoder' | 'decoder' | 'forensics' | 'settings' | 'comparator';

export type LangCode = 'EN' | 'HI' | 'KN' | 'ES' | 'FR';
export type Language = 'English' | 'Hindi' | 'Kannada' | 'Spanish' | 'French' | LangCode;

export interface GhostFile {
  name: string;
  data: Uint8Array;
  size?: number;
}

export type DecodeResult =
  | { type: 'text'; content: string; rawBytes?: Uint8Array }
  | { type: 'file'; name: string; data: Uint8Array }
  | { type: 'vault'; files: GhostFile[] }
  | { type: 'binary'; data: Uint8Array };

export interface ForensicResult {
  mse: number;
  psnr: number;
  heatmapUrl: string;
  diffUrl?: string;
}

export type EntropyLevel = 'none' | 'weak' | 'medium' | 'strong';

export interface PayloadMode {
  mode: 'text' | 'files';
}

export interface FileData {
  name: string;
  type: string;
  size: number;
  data: ArrayBuffer;
  previewUrl?: string;
}

export interface StegaResult {
  file: File;
  capacity?: number;
  message?: string;
  error?: string;
}

export interface ComparisonResult {
  psnr: number;
  mse: number;
  differenceMapUrl?: string;
}
