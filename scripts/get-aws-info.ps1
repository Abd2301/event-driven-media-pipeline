# Get AWS Resource Information for GitHub Actions Setup
# This script helps you get the S3 bucket name and CloudFront distribution ID

Write-Host "🔍 Getting AWS Resource Information for GitHub Actions Setup" -ForegroundColor Green
Write-Host ""

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not installed. Please install it first." -ForegroundColor Red
    Write-Host "Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Check if AWS is configured
try {
    aws sts get-caller-identity | Out-Null
    Write-Host "✅ AWS credentials are configured" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS credentials are not configured. Please run 'aws configure'" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Getting S3 Bucket Information..." -ForegroundColor Yellow

# List S3 buckets
Write-Host "Available S3 buckets:" -ForegroundColor Cyan
aws s3 ls --output table

Write-Host ""
Write-Host "📋 Getting CloudFront Distribution Information..." -ForegroundColor Yellow

# List CloudFront distributions
Write-Host "Available CloudFront distributions:" -ForegroundColor Cyan
aws cloudfront list-distributions --query "DistributionList.Items[].{ID:Id,Comment:Comment,DomainName:DomainName,Status:Status}" --output table

Write-Host ""
Write-Host "🔧 Next Steps:" -ForegroundColor Green
Write-Host "1. Copy the S3 bucket name and CloudFront distribution ID from above" -ForegroundColor White
Write-Host "2. Go to your GitHub repository → Settings → Secrets and variables → Actions" -ForegroundColor White
Write-Host "3. Add these secrets:" -ForegroundColor White
Write-Host "   - AWS_ACCESS_KEY_ID: Your IAM user's access key" -ForegroundColor White
Write-Host "   - AWS_SECRET_ACCESS_KEY: Your IAM user's secret key" -ForegroundColor White
Write-Host "   - S3_BUCKET_NAME: The S3 bucket name from above" -ForegroundColor White
Write-Host "   - CLOUDFRONT_DISTRIBUTION_ID: The CloudFront distribution ID from above" -ForegroundColor White
Write-Host ""
Write-Host "📖 For detailed setup instructions, see: docs/github-actions-setup.md" -ForegroundColor Yellow 