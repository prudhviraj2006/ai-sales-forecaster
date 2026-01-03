# 🚀 DEPLOY YOUR AI SALES FORECASTER - 100% FREE

## ⚡ QUICK DEPLOY TO RENDER (3 MINUTES)

### Step 1: Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `ai-sales-forecaster`
3. Make it Public
4. Click "Create repository"

### Step 2: Push Your Code
```bash
# Replace with your GitHub username
git remote set-url origin https://github.com/YOUR_USERNAME/ai-sales-forecaster.git
git push -u origin main
```

### Step 3: Deploy to Render
1. Go to https://render.com
2. Click "Sign Up" → Use GitHub
3. Click "New" → "Web Service"
4. Select your `ai-sales-forecaster` repository
5. Configure:
   - **Name**: `ai-sales-forecaster`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`

### Step 4: Add Environment Variables
In Render dashboard → Environment → Add:
```
OPENROUTER_API_KEY=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
PYTHONPATH=/opt/render/project/src
```

### 🎉 DONE!
Your app will be live at: `https://ai-sales-forecaster.onrender.com`

## ✅ What You Get:
- 🌐 **Live Web App**: Fully functional AI Sales Forecaster
- 📊 **All Features**: Upload, Forecast, Chat, Export
- 🔒 **HTTPS**: Automatic SSL certificate
- 📱 **Mobile Ready**: Responsive design
- 💾 **Database**: Free PostgreSQL included
- 🔄 **Auto-Deploy**: Updates when you push to GitHub

## ⚠️ Important Notes:
- App sleeps after 15 minutes (free tier)
- First visit may take 30 seconds to wake up
- 750 hours/month free (plenty for demo)

## 🆘 Need Help?
- Check the DEPLOY.md file in your project
- Render has excellent documentation
- Your app is already configured and ready!

**Your AI Sales Forecaster is ready to go live! 🚀**
