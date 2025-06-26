#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy the Serverless Task Management API to AWS

.DESCRIPTION
    This script deploys the serverless API using AWS CDK.
    It handles dependency installation, CDK bootstrap, and deployment.

.PARAMETER Environment
    The environment to deploy to (dev, staging, prod). Default is dev.

.PARAMETER Force
    Force deployment without confirmation.

.EXAMPLE
    .\deploy.ps1
    .\deploy.ps1 -Environment prod
    .\deploy.ps1 -Environment staging -Force
#>

param(
    [string]$Environment = "dev",
    [switch]$Force
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying Serverless Task Management API to $Environment environment..." -ForegroundColor Green

# Check if AWS CLI is configured
Write-Host "📋 Checking AWS CLI configuration..." -ForegroundColor Yellow
try {
    $awsIdentity = aws sts get-caller-identity 2>$null | ConvertFrom-Json
    if (-not $awsIdentity) {
        throw "AWS CLI not configured or no valid credentials"
    }
    Write-Host "✅ AWS CLI configured for account: $($awsIdentity.Account)" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Check if CDK is installed
Write-Host "📋 Checking CDK installation..." -ForegroundColor Yellow
try {
    $cdkVersion = cdk --version 2>$null
    Write-Host "✅ CDK installed: $cdkVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ CDK not installed. Installing CDK..." -ForegroundColor Yellow
    npm install -g aws-cdk
}

# Install Python dependencies
Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow
try {
    Set-Location cdk
    pip install -r requirements.txt
    Set-Location ..
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Bootstrap CDK (if needed)
Write-Host "🔧 Checking CDK bootstrap..." -ForegroundColor Yellow
try {
    cdk bootstrap
    Write-Host "✅ CDK bootstrap completed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  CDK bootstrap failed or already done" -ForegroundColor Yellow
}

# Deploy the stack
Write-Host "🚀 Deploying stack..." -ForegroundColor Yellow
try {
    Set-Location cdk
    
    if ($Force) {
        cdk deploy --all --context environment=$Environment --require-approval never
    } else {
        cdk deploy --all --context environment=$Environment
    }
    
    Set-Location ..
    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    
    # Get the API endpoint
    Write-Host "📋 Getting deployment outputs..." -ForegroundColor Yellow
    $outputs = cdk list-exports 2>$null | ConvertFrom-Json
    
    Write-Host "`n🎉 Deployment Summary:" -ForegroundColor Cyan
    Write-Host "Environment: $Environment" -ForegroundColor White
    Write-Host "Stack: TaskAPI-$Environment" -ForegroundColor White
    
    # Display API endpoint if available
    $apiEndpoint = $outputs | Where-Object { $_.Name -like "*APIEndpoint*" }
    if ($apiEndpoint) {
        Write-Host "API Endpoint: $($apiEndpoint.Value)" -ForegroundColor Green
        Write-Host "`n📝 Test your API:" -ForegroundColor Cyan
        Write-Host "Health Check: $($apiEndpoint.Value)/health" -ForegroundColor White
        Write-Host "Create Task: POST $($apiEndpoint.Value)/tasks" -ForegroundColor White
        Write-Host "List Tasks: GET $($apiEndpoint.Value)/tasks" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎯 Next steps:" -ForegroundColor Cyan
Write-Host "1. Test the API endpoints" -ForegroundColor White
Write-Host "2. Check CloudWatch logs for any issues" -ForegroundColor White
Write-Host "3. Monitor costs in AWS Cost Explorer" -ForegroundColor White
Write-Host "4. Add authentication if needed" -ForegroundColor White

Write-Host "`n✅ Deployment script completed!" -ForegroundColor Green 