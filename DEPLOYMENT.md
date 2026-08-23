# 🚀 Deployment Guide for QuietSend

This guide explains how to release QuietSend to the public and how to access it on your iPhone.

## 📱 Option 1: Instant Local Access (iPhone on same WiFi)

If you just want to test it on your iPhone **right now** and you are on the same WiFi network:

1.  Make sure the app is running on your computer (`npm run dev` or `npm run preview`).
2.  Look at the terminal output for the **Network** URL.
    -   Example: `http://192.168.1.5:3000/` or `http://192.168.29.179:3000/`
3.  Open Safari or Chrome on your iPhone.
4.  Type that exact URL number into the address bar.
    -   *Note: Your computer's firewall must allow connections on port 3000 (Node.js/Vite).*

---

## 🌍 Option 2: Public Release (Worldwide Access)

To make the app available to anyone, anywhere (including your iPhone on 4G/5G), deploy it to a static hosting provider. **Netlify** and **Vercel** are the easiest and free.

### Method A: Drag & Drop (Easiest)

1.  **Build** the app on your computer:
    ```bash
    npm run build
    ```
    (This creates a `dist` folder in your project directory).

2.  **Deploy to Netlify**:
    -   Go to [netlify.com](https://www.netlify.com/) and sign up/log in.
    -   Go to the "Sites" tab.
    -   Drag and drop the **`dist`** folder from your file explorer onto the Netlify page.
    -   Wait a few seconds. Netlify will give you a public URL (e.g., `https://quietsend-1234.netlify.app`).

### Method B: Connect to GitHub (Recommended for Updates)

1.  Push your code to a GitHub repository.
2.  Go to [Vercel.com](https://vercel.com/) or [Netlify.com](https://netlify.com/).
3.  Click "Add New Project" / "Import from Git".
4.  Select your QuietSend repository.
5.  **Build Settings** (usually auto-detected):
    -   **Build Command**: `npm run build`
    -   **Output Directory**: `dist`
    -   **Install Command**: `npm install`
6.  Click **Deploy**.

The URL they give you will work worldwide on any device!
