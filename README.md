<div align="center">
<img width="1200" height="475" alt="GhostByte" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GhostByte

A client-side steganography suite. Hide text or files inside PNG images using least-significant-bit embedding, with an optional AES-GCM encryption layer. Everything runs in the browser — nothing is uploaded and no key leaves the device.

**[Live demo](https://ghostbyte-seven.vercel.app)** · **[Full write-up](ABOUT_GHOSTBYTE.md)**

## What it does

**Encoder** — fuses a payload (text or a binary file) into a carrier image by modifying the least significant bits of the pixel data, keeping the visual difference below the threshold of human vision. Output is written strictly as PNG so lossy recompression can't destroy the payload. The optional AES-GCM layer encrypts the payload *before* embedding, so recovering the bits still leaves an attacker without the plaintext.

**Decoder** — scans an image's pixel matrix for the signature pattern, reconstructs the payload byte by byte, and detects whether the result is plain text or a binary file to download.

**Visual integrity comparator** — the part that checks its own work. Generates a differential heatmap showing exactly which pixels changed, reports MSE and PSNR between the original and the encoded image, and offers an interactive before/after slider.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Web Crypto API

## Run locally

Prerequisites: Node.js

```bash
npm install
npm run dev
```

Set `GEMINI_API_KEY` in `.env.local` before running.

## Limitations

Naive LSB embedding is detectable by statistical steganalysis — chi-square, RS and SPA attacks all target the bit-plane distribution this technique disturbs. GhostByte conceals data from an observer looking at the image, not from an analyst running the right tests on it.
