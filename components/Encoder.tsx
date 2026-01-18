import React, { useState, useEffect } from 'react';
import { encodeImage, getCarrierCapacity } from '../services/stegaEngine';

const Encoder: React.FC = () => {
  const [carrier, setCarrier] = useState<File | null>(null);
  const [carrierCapacity, setCarrierCapacity] = useState<number | null>(null);
  const [payloadText, setPayloadText] = useState('');
  const [payloadFile, setPayloadFile] = useState<File | null>(null);
  const [payloadType, setPayloadType] = useState<'text' | 'file'>('text');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (carrier) {
      getCarrierCapacity(carrier)
        .then(setCarrierCapacity)
        .catch(() => setCarrierCapacity(null));
    } else {
      setCarrierCapacity(null);
    }
  }, [carrier]);

  const handleEncode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carrier) return;

    setIsProcessing(true);
    setError(null);
    setResultUrl(null);

    try {
      let payload: string | Uint8Array;
      if (payloadType === 'text') {
        payload = payloadText;
      } else {
        if (!payloadFile) throw new Error('No payload file selected');
        payload = new Uint8Array(await payloadFile.arrayBuffer());
      }

      const encodedBlob = await encodeImage(carrier, payload, password);
      setResultUrl(URL.createObjectURL(encodedBlob));
    } catch (err: any) {
      setError(err.message || 'An error occurred during encoding.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Steganographic Encoder
        </h2>
        <p className="text-gray-400">
          Hide secret messages or files invisibly within your images. The resulting file will be a lossless PNG to ensure data integrity.
        </p>
      </div>

      <form onSubmit={handleEncode} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-300">Carrier Image (PNG/JPG/BMP)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCarrier(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-600/10 file:text-blue-400 hover:file:bg-blue-600/20 cursor-pointer bg-gray-800/50 rounded-xl border border-gray-700 p-2"
            />
            {carrierCapacity !== null && (
              <p className="text-xs text-blue-400 font-medium px-2 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 12v3a1 1 0 001 1h12a1 1 0 001-1v-3a1 1 0 00-1-1H4a1 1 0 00-1 1zm9-7a1 1 0 00-1 1v4h2V6a1 1 0 00-1-1zM9 5a1 1 0 00-1 1v4h2V6a1 1 0 00-1-1z" />
                </svg>
                Usable Capacity: {formatBytes(carrierCapacity)}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-300">Security Password (Optional)</label>
            <input
              type="password"
              placeholder="Lock with AES-GCM..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl p-3 text-gray-300 focus:ring-2 focus:ring-blue-600 outline-none placeholder:text-gray-600"
            />
          </div>
        </div>

        <div className="space-y-4 p-6 bg-gray-800/30 rounded-2xl border border-gray-800">
          <div className="flex items-center space-x-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={payloadType === 'text'}
                onChange={() => setPayloadType('text')}
                className="hidden"
              />
              <div className={`w-5 h-5 rounded-full border-2 mr-2 flex items-center justify-center transition-all ${payloadType === 'text' ? 'border-blue-500 bg-blue-500' : 'border-gray-600'}`}>
                {payloadType === 'text' && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <span className={payloadType === 'text' ? 'text-blue-400 font-medium' : 'text-gray-500'}>Text Payload</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={payloadType === 'file'}
                onChange={() => setPayloadType('file')}
                className="hidden"
              />
              <div className={`w-5 h-5 rounded-full border-2 mr-2 flex items-center justify-center transition-all ${payloadType === 'file' ? 'border-blue-500 bg-blue-500' : 'border-gray-600'}`}>
                {payloadType === 'file' && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <span className={payloadType === 'file' ? 'text-blue-400 font-medium' : 'text-gray-500'}>File Payload</span>
            </label>
          </div>

          {payloadType === 'text' ? (
            <textarea
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              placeholder="Enter your secret message here..."
              className="w-full h-32 bg-gray-950 border border-gray-800 rounded-xl p-4 text-gray-300 focus:ring-2 focus:ring-blue-600 outline-none resize-none font-mono text-sm"
            />
          ) : (
            <input
              type="file"
              onChange={(e) => setPayloadFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-gray-200 hover:file:bg-gray-600"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={!carrier || isProcessing}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${!carrier || isProcessing
            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'
            }`}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Encoding Payload...
            </div>
          ) : 'Execute Encoding'}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-900/20 border border-red-800/50 rounded-xl text-red-400 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {resultUrl && (
        <div className="mt-12 p-8 border border-green-800/30 bg-green-900/10 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-green-400 mb-2">Encoding Complete!</h3>
              <p className="text-gray-400 text-sm mb-6">
                Your secret information has been successfully embedded. Download the image below.
              </p>
              <a
                href={resultUrl}
                download="stega_output.png"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-500 transition-colors shadow-lg shadow-green-600/20"
              >
                Download Encoded Image
              </a>
            </div>
            <div className="w-full md:w-48 aspect-square rounded-2xl overflow-hidden border border-gray-800 shadow-inner bg-gray-950">
              <img src={resultUrl} alt="Encoded Result" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Encoder;
