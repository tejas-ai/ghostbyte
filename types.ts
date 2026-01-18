
export enum ToolType {
  ENCODER = 'encoder',
  DECODER = 'decoder',
  COMPARATOR = 'comparator',
  SETTINGS = 'settings'
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
