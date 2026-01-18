# 🐙 Final Step: Push to GitHub

I have already saved all your code locally! Now you just need to put it on the cloud.

## Step 1: Create the Repository
1.  Go to [github.com/new](https://github.com/new).
2.  **Repository Name**: `ghostbyte` (or whatever you like).
3.  **Public/Private**: Choose **Public** (easier for deployment).
4.  **Initialize this repository with**: Leave all these **unchecked**.
5.  Click **Create repository**.

## Step 2: Push Your Code
After creating the repo, GitHub will show you a screen with commands.

**Copy and paste these 3 lines into your terminal:**
(Make sure to replace `YOUR_USERNAME` with `tejas-ai`)

```bash
git remote add origin https://github.com/tejas-ai/ghostbyte.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy (Optional but Recommended)
Once pushed:
1.  Go to [Netlify.com](https://netlify.com) or [Vercel.com](https://vercel.com).
2.  Click **Import from GitHub**.
3.  Select `ghostbyte`.
4.  Click **Deploy**.

Your app will be live worldwide!
