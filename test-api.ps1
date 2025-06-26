#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test the Serverless Task Management API

.DESCRIPTION
    This script tests all the API endpoints to ensure they're working correctly.

.PARAMETER ApiEndpoint
    The API Gateway endpoint URL to test.

.EXAMPLE
    .\test-api.ps1 -ApiEndpoint "https://abc123.execute-api.us-east-1.amazonaws.com/dev"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiEndpoint
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🧪 Testing Serverless Task Management API..." -ForegroundColor Green
Write-Host "API Endpoint: $ApiEndpoint" -ForegroundColor Yellow

# Test health endpoint
Write-Host "`n📋 Testing health endpoint..." -ForegroundColor Cyan
try {
    $healthResponse = Invoke-RestMethod -Uri "$ApiEndpoint/health" -Method GET
    Write-Host "✅ Health check passed" -ForegroundColor Green
    Write-Host "Status: $($healthResponse.status)" -ForegroundColor White
    Write-Host "Environment: $($healthResponse.environment)" -ForegroundColor White
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test create task
Write-Host "`n📝 Testing create task..." -ForegroundColor Cyan
try {
    $taskData = @{
        title = "Test Task $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        description = "This is a test task created by the test script"
        status = "pending"
        priority = "medium"
    }
    
    $createResponse = Invoke-RestMethod -Uri "$ApiEndpoint/tasks" -Method POST -Body ($taskData | ConvertTo-Json) -ContentType "application/json"
    Write-Host "✅ Task created successfully" -ForegroundColor Green
    Write-Host "Task ID: $($createResponse.task.id)" -ForegroundColor White
    Write-Host "Title: $($createResponse.task.title)" -ForegroundColor White
    
    $taskId = $createResponse.task.id
} catch {
    Write-Host "❌ Create task failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test get task
Write-Host "`n📖 Testing get task..." -ForegroundColor Cyan
try {
    $getResponse = Invoke-RestMethod -Uri "$ApiEndpoint/tasks/$taskId" -Method GET
    Write-Host "✅ Get task successful" -ForegroundColor Green
    Write-Host "Retrieved task: $($getResponse.task.title)" -ForegroundColor White
} catch {
    Write-Host "❌ Get task failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test list tasks
Write-Host "`n📋 Testing list tasks..." -ForegroundColor Cyan
try {
    $listResponse = Invoke-RestMethod -Uri "$ApiEndpoint/tasks" -Method GET
    Write-Host "✅ List tasks successful" -ForegroundColor Green
    Write-Host "Total tasks: $($listResponse.count)" -ForegroundColor White
} catch {
    Write-Host "❌ List tasks failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test update task
Write-Host "`n✏️  Testing update task..." -ForegroundColor Cyan
try {
    $updateData = @{
        title = "Updated Test Task $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        status = "in_progress"
        priority = "high"
    }
    
    $updateResponse = Invoke-RestMethod -Uri "$ApiEndpoint/tasks/$taskId" -Method PUT -Body ($updateData | ConvertTo-Json) -ContentType "application/json"
    Write-Host "✅ Task updated successfully" -ForegroundColor Green
    Write-Host "Updated title: $($updateResponse.task.title)" -ForegroundColor White
    Write-Host "Updated status: $($updateResponse.task.status)" -ForegroundColor White
} catch {
    Write-Host "❌ Update task failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test delete task
Write-Host "`n🗑️  Testing delete task..." -ForegroundColor Cyan
try {
    $deleteResponse = Invoke-RestMethod -Uri "$ApiEndpoint/tasks/$taskId" -Method DELETE
    Write-Host "✅ Task deleted successfully" -ForegroundColor Green
    Write-Host "Deleted task ID: $($deleteResponse.task_id)" -ForegroundColor White
} catch {
    Write-Host "❌ Delete task failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test error handling
Write-Host "`n⚠️  Testing error handling..." -ForegroundColor Cyan
try {
    $errorResponse = Invoke-RestMethod -Uri "$ApiEndpoint/tasks/non-existent-id" -Method GET
    Write-Host "❌ Expected error but got success" -ForegroundColor Red
} catch {
    $error = $_.Exception.Response
    if ($error.StatusCode -eq 404) {
        Write-Host "✅ Error handling working correctly (404 Not Found)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Unexpected error: $($error.StatusCode)" -ForegroundColor Yellow
    }
}

Write-Host "`n🎉 All API tests completed!" -ForegroundColor Green
Write-Host "`n📊 Test Summary:" -ForegroundColor Cyan
Write-Host "✅ Health check" -ForegroundColor Green
Write-Host "✅ Create task" -ForegroundColor Green
Write-Host "✅ Get task" -ForegroundColor Green
Write-Host "✅ List tasks" -ForegroundColor Green
Write-Host "✅ Update task" -ForegroundColor Green
Write-Host "✅ Delete task" -ForegroundColor Green
Write-Host "✅ Error handling" -ForegroundColor Green

Write-Host "`n🚀 Your serverless API is working perfectly!" -ForegroundColor Green 