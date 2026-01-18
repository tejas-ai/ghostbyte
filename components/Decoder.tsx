import React, { useState } from 'react';
import { decodeImage } from '../services/stegaEngine';

const Decoder: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [payload, setPayload] = useState<Uint8Array | null>(null);
  const [payloadText, setPayloadText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDecode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setPayload(null);
    setPayloadText(null);

    try {
      const decodedData = await decodeImage(file, password);
      setPayload(decodedData);

      const text = new TextDecoder().decode(decodedData);
      // Basic check if it's readable text
      if (/^[\x20-\x7E\s]*$/.test(text)) {
        setPayloadText(text);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to decode image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPayload = () => {
    if (!payload) return;
    const blob = new Blob([payload], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'decoded_payload.bin';
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Steganographic Decoder
        </h2>
        <p className="text-gray-400">
          Upload an image to extract hidden data. If the payload was encrypted, provide the correct password below.
        </p>
      </div>

      <form onSubmit={handleDecode} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-300">Carrier Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-600/10 file:text-purple-400 hover:file:bg-purple-600/20 cursor-pointer bg-gray-800/50 rounded-xl border border-gray-700 p-2"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-300">Decryption Password (If needed)</label>
            <input
              type="password"
              placeholder="Enter password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl p-3 text-gray-300 focus:ring-2 focus:ring-purple-600 outline-none placeholder:text-gray-600"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!file || isProcessing}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${!file || isProcessing
            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
            : 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-600/20'
            }`}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Extracting Payload...
            </div>
          ) : 'Extract Hidden Data'}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-900/20 border border-red-800/50 rounded-xl text-red-400 text-sm">
          <strong>Extraction Error:</strong> {error}
        </div>
      )}

      {payload && (
        <div className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 border border-purple-800/30 bg-purple-900/10 rounded-3xl">
            <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center">
              <span className="mr-2">✨</span> Extraction Result
            </h3>

            <div className="flex flex-wrap gap-4 mb-6">
              <button
                onClick={downloadPayload}
                className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors shadow-md text-sm font-semibold"
              >
                Download Binary Payload
              </button>
            </div>

            {payloadText ? (
              <div className="space-y-4">
                <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">Plaintext Recovery</p>
                <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl text-gray-300 font-mono text-sm max-h-64 overflow-auto break-all">
                  {payloadText}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">
                Payload contains binary data that is not human-readable text.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Decoder;
