# 🐙 How to Upload GhostByte to GitHub

Since you haven't uploaded this before, we need to set up your identity and send the code to GitHub.

## Step 1: Tell Git Who You Are
Run these two commands in your terminal (replace with your details):
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 2: Save Your Code
Run these commands to save your current work:
```bash
git add .
git commit -m "Initial release of GhostByte"
```

## Step 3: Create a Repository on GitHub
1.  Go to [github.com/new](https://github.com/new).
2.  **Repository Name**: `ghostbyte` (or whatever you like).
3.  **Public/Private**: Choose **Public** if you want to deploy directly to Netlify/Vercel for free easily.
4.  **Initialize this repository with**: Leave all these **unchecked** (no README, no .gitignore).
5.  Click **Create repository**.

## Step 4: Connect and Push
GitHub will show you a page with commands. Look for the section **"…or push an existing repository from the command line"**.

Copy and paste those 3 lines into your terminal. They will look like this:
```bash
git remote add origin https://github.com/YOUR_USERNAME/ghostbyte.git
git branch -M main
git push -u origin main
```

## Step 5: Finished!
Once you push, your code is on GitHub!
Now you can go to [Vercel](https://vercel.com) or [Netlify](https://netlify.com) and select "Import from GitHub" to deploy comfortably.
