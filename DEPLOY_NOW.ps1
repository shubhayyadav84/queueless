# QueueLess Deployment Script
# Run this script to deploy your application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  QueueLess Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if GitHub repo exists
Write-Host "Step 1: Checking GitHub Repository..." -ForegroundColor Yellow
$repoExists = $false
try {
    $response = Invoke-WebRequest -Uri "https://api.github.com/repos/shubhayyadav84/queueless" -Method Head -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        $repoExists = $true
        Write-Host "✅ Repository exists!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Repository not found. Creating..." -ForegroundColor Red
}

if (-not $repoExists) {
    Write-Host ""
    Write-Host "Please create the repository first:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://github.com/new" -ForegroundColor White
    Write-Host "2. Repository name: queueless" -ForegroundColor White
    Write-Host "3. Click 'Create repository'" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor Cyan
    exit
}

# Push to GitHub
Write-Host ""
Write-Host "Step 2: Pushing to GitHub..." -ForegroundColor Yellow
& 'C:\Program Files\Git\bin\git.exe' push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Code pushed to GitHub successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to push. You may need to authenticate." -ForegroundColor Red
    Write-Host "   A browser window should open for GitHub login." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Next Steps for Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend (Render):" -ForegroundColor Yellow
Write-Host "1. Go to: https://render.com" -ForegroundColor White
Write-Host "2. Sign up with GitHub" -ForegroundColor White
Write-Host "3. Click 'New +' → 'Web Service'" -ForegroundColor White
Write-Host "4. Connect your GitHub repo: shubhayyadav84/queueless" -ForegroundColor White
Write-Host "5. Settings:" -ForegroundColor White
Write-Host "   - Root Directory: backend" -ForegroundColor Gray
Write-Host "   - Build Command: npm install" -ForegroundColor Gray
Write-Host "   - Start Command: npm start" -ForegroundColor Gray
Write-Host "6. Add Environment Variables:" -ForegroundColor White
Write-Host "   - MONGODB_URI: (from MongoDB Atlas)" -ForegroundColor Gray
Write-Host "   - JWT_SECRET: (generate a random string)" -ForegroundColor Gray
Write-Host ""
Write-Host "Frontend (Vercel):" -ForegroundColor Yellow
Write-Host "1. Go to: https://vercel.com" -ForegroundColor White
Write-Host "2. Sign up with GitHub" -ForegroundColor White
Write-Host "3. Click 'Add New Project'" -ForegroundColor White
Write-Host "4. Import your GitHub repo" -ForegroundColor White
Write-Host "5. Settings:" -ForegroundColor White
Write-Host "   - Framework Preset: Vite" -ForegroundColor Gray
Write-Host "   - Root Directory: frontend" -ForegroundColor Gray
Write-Host "6. Add Environment Variables:" -ForegroundColor White
Write-Host "   - VITE_API_URL: (your Render backend URL + /api)" -ForegroundColor Gray
Write-Host "   - VITE_SOCKET_URL: (your Render backend URL)" -ForegroundColor Gray
Write-Host ""
Write-Host "Your Repository: https://github.com/shubhayyadav84/queueless" -ForegroundColor Cyan
Write-Host ""
