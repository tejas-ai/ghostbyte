# 🛡️ QuietSend — Client-Side Steganography & Forensic Enclave

> **Zero-Server-Retention** | **Authenticated Cryptography** | **100% In-Browser Execution**

QuietSend is an open-source, client-side cryptographic steganography application that conceals encrypted files and messages inside lossless digital images (PNG, TIFF, WebP, BMP) and uncompressed 16-bit PCM WAV audio tracks.

All cryptographic operations execute exclusively on your local device via the standard Web Cryptography API (`crypto.subtle`). No payloads, keys, or photos are ever transmitted to any remote server.

---

## 🎯 Threat Model & Explicit Cryptographic Boundaries

### What QuietSend Protects Against
* **Transport & Storage Intermediaries**: Chat applications, email filters, cloud drives, and network inspection tools that inspect payloads or detect plain ciphertext signatures.
* **Brute-Force & Collision Attacks**: Authenticated AES-GCM-256 encryption with 600,000 PBKDF2 iterations (OWASP recommendations) prevents false-positive decryptions and provides tag authentication.
* **Passive Visual & Auditory Inspection**: Conceals payloads in spatial pixel LSBs ($PSNR > 42\text{ dB}$) and acoustic audio bitplanes ($SNR > 50\text{ dB}$), imperceptible to human senses.
* **Duress & Coercion**: Optional Deniable Honey-Vault provides dual-passphrase decryption revealing a benign decoy payload.

### Structural Limits (What Web-Delivered Steganography Cannot Do)
* **Origin/Delivery Trust Boundary**: Web-delivered cryptography protects data from the carrier to the browser. It cannot protect against an adversary who compromises the hosting server/DNS to serve altered client scripts. For high-threat environments, verify reproducible build hashes (`npm run verify`) or clone and run locally.
* **Sender Authentication**: Asymmetric ECDH envelopes encrypt data to the recipient's public key and verify ciphertext integrity, but do **not** provide digital signatures. Anyone holding the recipient's public key can construct an envelope.
* **Lossy Compression**: JPEG re-encoding, WebP lossy compression, and chat apps that transcode media destroy LSB bitstreams. Carriers must be transported as uncompressed/raw documents.
* **Active Forensic Steganalysis**: QuietSend hides your message from anyone casually looking — a messaging platform, an automated backup scan, or someone scrolling through your gallery. It does **not** hide it from someone who suspects a file contains something and runs statistical steganalysis on it. Established techniques (such as RS Analysis and Sample Pair Analysis) detect LSB embedding at any density, including the default. If you are in a situation where being found to be hiding something is itself dangerous, this tool is not sufficient protection.

---

## 🌟 Key Features

* **🔑 Asymmetric ECDH P-256 Keyring**: Encrypt directly to a recipient's public key without sharing secret passphrases out-of-band.
* **🎵 16-bit PCM WAV Audio Steganography**: Embed encrypted bitstreams into acoustic audio samples.
* **🔒 Authenticated AES-GCM-256 Encryption**: Hardened with 600,000 PBKDF2 iterations.
* **⚡ Dedicated Web Worker Multiplexer**: Background thread execution keeps UI rendering at 60 FPS during encoding/decoding.
* **📱 Adaptive Mobile Safari & iPadOS Support**: Canvas memory bounds (4096px / 16.7 MP) tuned for iPhone and iPadOS hardware limits.
* **🛡️ Live CAVP Diagnostic Suite**: Real-time cryptographic vector self-tests and latency benchmarks in the browser.
* **🍯 Plausible Deniability Honey-Vault**: Duress defense with dual-passphrase decoy extraction.
* **🔍 Forensic Comparator**: Split comparison slider, MSE, PSNR, difference heatmaps, and 8-level bit-plane slicing.
* **🌐 Multilingual Support**: English, Hindi, Kannada, Spanish, and French.

---

## 🚀 Quick Start (Run Locally)

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or newer)
* npm

### Installation & Execution
```bash
# 1. Clone repository
git clone https://github.com/tejasj/quietsend.git
cd quietsend

# 2. Install dependencies
npm install

# 3. Run automated cryptographic test suite
npm test

# 4. Start local development enclave
npm run dev
```

### Reproducible Production Build & Verification
```bash
# Build bundle and generate cryptographic checksums
npm run build:verify
```
This generates `dist/SHA256SUMS` listing cryptographic SHA-256 digests of all deployed client bundles for independent audit verification.

---

## 📊 Technical Specifications

| Parameter | Specification |
| :--- | :--- |
| **Symmetric Cipher** | AES-GCM-256 (128-bit authentication tag) |
| **Asymmetric Cipher** | ECDH (NIST Curve P-256) + HKDF-SHA-256 |
| **Key Derivation** | PBKDF2-HMAC-SHA-256 (600,000 rounds) |
| **Image Densities** | LSB-1 through LSB-6 (0.375 to 2.25 Bytes/pixel) |
| **Audio Format** | 16-bit PCM RIFF WAV (44.1kHz / 48kHz) |
| **Archive Format** | Uncompressed PKZIP with IEEE 802.3 CRC-32 |
| **Execution** | 100% Client-Side WebCrypto (Zero Server Retention) |

---

## 📬 Security Disclosures & Contact

To report security vulnerabilities, cryptographic flaws, or request key verifications:
* **Security Contact**: `security@quietsend.app`
* **Repository**: [github.com/tejasj/quietsend](https://github.com/tejasj/quietsend)

---

## 📄 License
MIT License. Built for journalists, privacy researchers, and security professionals worldwide.
