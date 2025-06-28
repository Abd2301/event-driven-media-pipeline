# Frontend Deployment Script
# This script builds the frontend and prepares it for CloudFront deployment

Write-Host "Building frontend for production..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "Warning: .env file not found. Please create one based on .env.example" -ForegroundColor Yellow
    Write-Host "You can copy .env.example to .env and update the values" -ForegroundColor Yellow
}

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Blue
    npm install
}

# Build the application
Write-Host "Building application..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build completed successfully!" -ForegroundColor Green
    Write-Host "Build output is in the 'build' directory" -ForegroundColor Green
    Write-Host "" -ForegroundColor White
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Upload the contents of the 'build' directory to your S3 bucket" -ForegroundColor White
    Write-Host "2. Configure CloudFront to serve the files from S3" -ForegroundColor White
    Write-Host "3. Update your domain settings if using a custom domain" -ForegroundColor White
} else {
    Write-Host "Build failed! Please check the error messages above." -ForegroundColor Red
    exit 1
} 