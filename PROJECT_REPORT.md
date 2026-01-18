# Project Report: GhostByte Steganography System

**Subject**: Advanced Web Application Development / Cybersecurity
**Project Title**: GhostByte - Advanced Steganography & Encryption Suite

---

## 1. Executive Summary
GhostByte is a comprehensive web-based cybersecurity tool designed to facilitate secure, invisible communication through digital steganography. By embedding encrypted payloads within image carriers using Least Significant Bit (LSB) manipulation, the system ensures that sensitive data can be transmitted through clear channels without arousing suspicion. This report documents the development lifecycle of GhostByte, from conceptualization and requirements gathering to system design, implementation using modern web technologies (React, Vite, Tailwind CSS), and final verification.

## 2. Introduction
### 2.1 Background
In an era of ubiquitous digital surveillance, traditional encryption methods (like PGP) secure the *content* of a message but fail to hide the *existence* of the communication itself. Steganography addresses this gap by concealing data within innocuous cover media.

### 2.2 Objective
The primary objective of this project was to develop a client-side, zero-knowledge steganography application that combines:
- **Stealth**: High-fidelity image manipulation undetectable by the human eye.
- **Security**: AES-GCM encryption for payload protection.
- **Usability**: A modern, responsive user interface.
- **Analysis**: Built-in forensic tools to verify image integrity.

## 3. System Analysis and Requirements
### 3.1 Problem Statement
Existing steganography tools are often command-line based, platform-dependent, or require server-side processing which compromises privacy. Users need a solution that is accessible via a web browser but performs all operations locally.

### 3.2 Functional Requirements
1.  **Encoder Module**: Ability to upload a carrier image and a payload (text/file), encrypt the payload with a password, and generate a steganographic PNG image.
2.  **Decoder Module**: Ability to parse an encoded image, extract the bitstream, decrypt it using a password, and reconstruct the original payload.
3.  **Comparator Module**: Tools to calculate Mean Squared Error (MSE) and Peak Signal-to-Noise Ratio (PSNR) between original and modified images, including a visual difference heatmap.

### 3.3 Non-Functional Requirements
-   **Privacy**: Zero server uploads; all processing must happen in the browser (client-side).
-   **Performance**: Real-time encoding/decoding for images up to 4K resolution.
-   **Compatibility**: Cross-browser support (Chrome, Firefox, Edge, Safari).

## 4. System Design
### 4.1 Technology Stack
-   **Frontend Framework**: React 19 (for component-based UI architecture).
-   **Build Tool**: Vite (for rapid development and optimized production builds).
-   **Styling**: Tailwind CSS v4 (for utility-first, responsive design with dark mode).
-   **Language**: TypeScript (for type safety and robust code).
-   **Logic**: Custom LSB steganography algorithms implemented in pure JavaScript/TypeScript.

### 4.2 Architecture
The application follows a modular Single Page Application (SPA) architecture:
-   **`components/`**: Reusable UI blocks (Encoder, Decoder, Comparator, Navigation).
-   **`services/`**: Core business logic (stegaEngine.ts for bit manipulation).
-   **`contexts/`**: Global state management (Theme, Language).
-   **`assets/`**: Static resources.

## 5. Implementation Details
### 5.1 The LSB Algorithm
The core engine utilizes Least Significant Bit injection. The alpha channel of the image pixels is preserved to maintain transparency where applicable, while the RGB channels are modified.
*   **Encoding**: The payload is converted to binary. The least significant bit of each pixel's color channel is replaced with a bit from the payload.
*   **Decoding**: The engine reads the LSBs from the image to reconstruct the binary stream, which is then converted back to text or file data.

### 5.2 Encryption Layer
Before embedding, payloads are encrypted using the Web Crypto API (AES-GCM), providing confidentiality and integrity with a user-supplied password.

### 5.3 UI/UX Implementation
-   **Dark Mode**: Implemented via Tailwind's `dark:` modifier and CSS variables for a "hacker/cybersecurity" aesthetic.
-   **Responsiveness**: Grid and Flexbox layouts ensure usability on mobile and desktop.
-   **Forensic Visualization**: The Comparator module uses HTML5 Canvas to compute pixel-by-pixel differences and render a heatmap overlay.

## 6. Testing and Verification
### 6.1 Functional Testing
-   **Text Payload**: Verified encoding and decoding of long strings and special characters.
-   **File Payload**: Tested embedding images and documents (PDFs) within carrier images.
-   **Password Protection**: Confirmed that incorrect passwords fail to function, returning appropriate errors.

### 6.2 Performance Testing
-   **Capacity**: Verified correct calculation of maximum payload size based on carrier resolution.
-   **Speed**: Encoding a 1080p image typically takes <500ms on standard hardware.

### 6.3 Forensic Analysis
-   **PSNR Metrics**: Achieved PSNR values consistently above 50dB, indicating high image quality and invisibility to the naked eye.
-   **MSE**: Observed near-zero Mean Squared Error, validating the minimal impact of the LSB algorithm.

## 7. Challenges and Solutions
-   **Issue**: `tailwindcss` v4 build conflicts.
    -   *Solution*: Migrated to `@tailwindcss/postcss` and updated Vite configuration to support the latest CSS standards.
-   **Issue**: Browser memory limits for large files.
    -   *Solution*: Optimized array buffer handling and implemented capacity checks to prevent crashes.

## 8. Conclusion and Future Scope
### 8.1 Conclusion
GhostByte successfully meets all project requirements, delivering a secure, client-side steganography suite. It empowers users to protect their communications without relying on third-party servers.

### 8.2 Future Scope
-   Support for audio and video steganography.
-   Implementation of more robust algorithms (e.g., DCT/Frequency domain) to survive image compression.
-   PWA (Progressive Web App) support for offline usage.

---
*Report generated by GhostByte Development Team*
