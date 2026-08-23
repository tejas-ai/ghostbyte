# 📱 WhatsApp Communication Scripts for QuietSend

## 🟢 WhatsApp Status (24h Story)
**Option 1 (Short & Punchy):**
"🚀 Just dropped: **QuietSend**.
Hide **MP3s, PDFs, EXEs**, or secret text inside ANY photo.
Password protect it 🔒 or leave it open 🔓.
DM me to try it."

**Option 2 (The Hook):**
"Stop sending plain files. 🛑
With **QuietSend**, I can hide an entire **MP3 song** or **PDF doc** inside a single picture.
Invisible. Secure. 
Reply if you want the link."

---

## 📩 Direct Reply to "What is this?" / "How does it work?"

**The Casual Explanation:**
"It's a privacy tool I built called **QuietSend**.
Basically, you can take a normal photo and hide files inside it so no one else knows they are there.

You can hide:
*   🎵 **MP3s** (Audio/Music)
*   📄 **PDFs** (Documents)
*   💻 **EXEs** (Apps/Programs)
*   💬 **Secret Texts**

You can set a **password** 🔑 if it's sensitive, or just leave it password-free for quick access. The receiver just uses the app to 'scan' the image and extract the file."

---

## 🧠 Deep Dive (Reply to "I want to know more")

"Sure! It's based on **Steganography** (the art of hiding data).

Most apps encrypt data (like WhatsApp E2E), but everyone *knows* you sent a message. 
**QuietSend** makes it look like you just sent a meme or a landscape photo. 🖼️

**The Tech:**
1. You upload a cover image.
2. You select a file (MP3, PDF, etc.) to hide inside it.
3. The app rearranges the pixels at a microscopic level (LSB) to hold your data.
4. You send the image.
5. The receiver uses QuietSend to 'read' the pixels and get the file back.

It runs 100% on your phone/browser. Nothing goes to my server, so it's completely private. 

**Want to try hiding something?**"

---

## 🛠️ Reply to "How did you build that?" / "Tech Stack"

"I built it as a **Progressive Web App (PWA)** so it runs everywhere.

**The Tech Stack:**
*   **Frontend:** React 19 + TypeScript (for reliability)
*   **Speed:** Vite (super fast build tool)
*   **Styling:** Tailwind CSS v4 (for that clean dark mode look)
*   **Cryptography:** Web Crypto API (AES-GCM 256-bit encryption)
*   **Steganography Logic:** Custom HTML5 Canvas pixel manipulation (LSB)

**Why this stack?**
I wanted it to be **Client-Side Only**.
Meaning, no backend server sees your files. All the encryption and hiding happens right in your browser's memory. It’s safer that way."

---

## 🔧 Reply to "How did you connect those APIs?"

"Actually, that's the cool part—I didn't 'connect' to any external server APIs! 🤯

Everything runs locally in your browser using **Native Web APIs**. Here's the flow:

1.  **File API**: Reads your file as a raw ArrayBuffer (binary data).
2.  **Web Crypto API**: I pipe that binary data into the browser's native encryption engine (AES-GCM) to scramble it.
3.  **Canvas API**: I draw your image onto a hidden canvas, get its pixel data (RGBA), and then stitch the encrypted binary bits into the Least Significant Bits of the pixels.

So instead of sending data to an API endpoint (like `POST /api/upload`), I'm just passing data between these internal browser engines. It's like building a secure vault directly inside Chrome/Safari."

---

## 📢 Broadcast / Group Message
"Hey everyone! 👋 
I'm looking for beta testers for my new cybersecurity app, **QuietSend**.

It lets you hide files inside harmless images using steganography.
**Supported Formats:**
✅ **Secret Messages**
✅ **Audio (.mp3)**
✅ **Documents (.pdf)**
✅ **Software (.exe)**

**Features:**
🔒 **Password Protection**: Encrypt it so only they can open it.
🔓 **Open Mode**: Send hidden files that anyone with the app can extract.

It's pretty cool (and a bit dangerous/powerful). 
**Reply 'LINK' if you want to try it out!**"
