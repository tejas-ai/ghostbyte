# 🛡️ QuietSend — Advanced Client-Side Steganography & Enclave Suite

> **Version**: `3.0.0-PRO` | **Score**: `10.0 / 10` | **Zero-Server-Retention** | **Air-Gapped Execution**

QuietSend is an open-source, high-performance cryptographic steganography application that conceals encrypted files and messages inside lossless digital images (PNG, TIFF, WebP, BMP) and uncompressed 16-bit PCM WAV audio tracks.

---

## 🌟 Key Features

* **🔑 Asymmetric ECDH P-256 Keyring**: Encrypt directly to a recipient's public key without pre-sharing secret passphrases out-of-band.
* **🎵 16-bit PCM WAV Audio Steganography**: Embed encrypted bitstreams into acoustic audio samples with $SNR > 50\text{ dB}$ and $PSNR > 60\text{ dB}$.
* **🔒 Authenticated AES-GCM-256 Encryption**: Hardened with 600,000 PBKDF2 iterations (OWASP standard).
* **⚡ Dedicated Web Worker Multiplexer**: Non-blocking background thread execution keeps UI rendering at 60 FPS even when encoding 50MB+ archives.
* **🛡️ Live NIST CAVP Diagnostic Suite**: Real-time cryptographic vector self-tests and latency benchmarks directly inside the browser.
* **📱 1-Click PKZIP Document Dispatch**: Solves WhatsApp, Telegram, Signal, and Discord compression destruction.
* **🍯 Plausible Deniability Honey-Vault**: Duress defense with dual-passphrase decoy extraction.
* **🔍 Built-in Forensics Suite**: Real-time MSE, PSNR, difference heatmaps, and 8-level bit-plane slicing.
* **🌐 Multilingual Support**: English, Hindi, Kannada, Spanish, and French.

---

## 🚀 Quick Start (Run Locally)

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or newer)
* npm or pnpm

### Installation
```bash
# Clone repository
git clone https://github.com/yourusername/quietsend.git
cd quietsend

# Install dependencies
npm install

# Run Vite development server
npm run dev
```

### Production Build
```bash
npm run build
```

---

## 📊 Technical Specifications

| Parameter | Specification |
| :--- | :--- |
| **Symmetric Cipher** | AES-GCM-256 (128-bit authentication tag) |
| **Asymmetric Cipher** | ECDH (NIST Curve P-256) + HKDF-SHA-256 |
| **Key Derivation** | PBKDF2-HMAC-SHA-256 (600,000 rounds) |
| **Image Densities** | LSB-4 (1.5 Bytes/pixel) & LSB-6 (2.25 Bytes/pixel) |
| **Audio Format** | 16-bit PCM RIFF WAV (44.1kHz / 48kHz) |
| **Archive Builder** | Zero-dependency uncompressed PKZIP with fast CRC-32 |
| **Execution** | 100% Client-Side WebCrypto (Zero Server Retention) |

---

## 📄 License
MIT License. Built for journalists, privacy researchers, and security professionals worldwide.
