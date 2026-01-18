# 👻 GhostByte: The Art of Invisible Data

> *"In a world of total surveillance, the only true privacy is invisibility."*

## 🔍 System Overview
**GhostByte** is an advanced, military-grade steganography suite designed for the secure concealment of digital assets. Unlike traditional encryption which screams "I have a secret," GhostByte hides your data in plain sight—embedding it directly into the pixel structure of innocuous images.

To the naked eye, it's just a photo. To the intended recipient, it's a secure data container.

---

## 🛠️ Core Modules

### 1. 🧬 The Encoder (Injection Protocol)
The heart of the system. This module takes your **Carrier Image** and fuses it with your **Payload** (text or binary files).
- **Stealth Integration**: Modifies the Least Significant Bits (LSB) of the image data, ensuring the visual difference is imperceptible to human vision.
- **AES-GCM Encryption**: Optional military-grade encryption layer that wraps your payload before embedding. Even if the image is analyzed, the data remains locked without the key.
- **Lossless Output**: Exports strictly as PNG to prevent compression artifacts from destroying your hidden message.

### 2. 🔓 The Decoder (Extraction Protocol)
The retrieval tool. Feed it any image suspected of containing GhostByte data.
- **Auto-Detection**: Scans the pixel matrix for signature patterns.
- **Payload Recovery**: Reconstructs the original message or file byte-by-byte.
- **Smart Formatting**: Automatically detects if the extracted payload is plain text (for instant reading) or a binary file (for download).

### 3. 🔬 Visual Integrity Forensic Comparator
A scientific analysis workbench for verifying stealth.
- **Differential Heatmap**: Generates a high-contrast map showing exactly where pixels were modified.
- **Metrics Dashboard**:
    - **MSE (Mean Squared Error)**: Quantifies the average pixel deviation.
    - **PSNR (Peak Signal-to-Noise Ratio)**: A high db value guarantees invisibility.
- **Interactive Slider**: A real-time comparison tool to inspect the original vs. encoded image side-by-side.

---

## 🛡️ Technical Specifications
- **Architecture**: Built on a reactive, high-performance web core using **React 19** and **Vite**.
- **Styling**: Engineered with **Tailwind CSS v4** for a sleek, dark-mode native interface.
- **Security**: Client-side processing ensures your secrets never leave your device. Analysis happens in your browser's memory, not on a server.

---

## 🚀 Mission Objective
GhostByte empowers journalists, activists, and privacy advocates to transmit sensitive information through open channels without raising suspicion. By turning every image on the internet into a potential secure courier, we redefine the boundaries of digital privacy.

**Stay invisible.**
