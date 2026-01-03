# AI Sales Forecaster - Render Deployment

## 🚀 Quick Deploy to Render (FREE)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "AI Sales Forecaster ready for deployment"
git branch -M main
git remote add origin https://github.com/yourusername/ai-sales-forecaster.git
git push -u origin main
```

### Step 2: Deploy to Render
1. Go to [render.com](https://render.com)
2. Sign up for FREE account
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Use these settings:
   - **Name**: ai-sales-forecaster
   - **Region**: Choose nearest
   - **Branch**: main
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free

### Step 3: Environment Variables
Add these in Render dashboard:
```
OPENROUTER_API_KEY=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
PYTHONPATH=/opt/render/project/src
```

### ✅ Done!
Your app will be live at: `https://ai-sales-forecaster.onrender.com`

## 📱 Features Available:
- ✅ Free hosting
- ✅ Automatic HTTPS
- ✅ Custom domain support
- ✅ Free PostgreSQL database
- ✅ Auto-deployment from GitHub

## 🔄 Limitations:
- App sleeps after 15 minutes of inactivity
- Wakes up on first request (may take 30 seconds)
- 750 hours/month free (more than enough)
