# GitHub Actions CI/CD Setup Guide

This guide will help you set up automated deployment of your React frontend to CloudFront using GitHub Actions.

## Prerequisites

- Your React app is already deployed to S3 and CloudFront
- You have AWS CLI configured locally
- Your code is pushed to a GitHub repository

## Step 1: Create IAM User for GitHub Actions

### 1.1 Create IAM User
1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → **Create user**
3. Name: `github-actions-frontend-deploy`
4. Select **Programmatic access**
5. Click **Next: Permissions**

### 1.2 Attach Permissions
1. Click **Attach existing policies directly**
2. Search and attach these policies:
   - `AmazonS3FullAccess` (or create a custom policy for your specific bucket)
   - `CloudFrontFullAccess` (or create a custom policy for your specific distribution)

### 1.3 Create Custom Policy (Recommended)
Instead of using full access policies, create a custom policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::YOUR-BUCKET-NAME",
                "arn:aws:s3:::YOUR-BUCKET-NAME/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "cloudfront:CreateInvalidation",
                "cloudfront:GetInvalidation",
                "cloudfront:ListInvalidations"
            ],
            "Resource": "arn:aws:cloudfront::YOUR-ACCOUNT-ID:distribution/YOUR-DISTRIBUTION-ID"
        }
    ]
}
```

### 1.4 Get Access Keys
1. After creating the user, go to the **Security credentials** tab
2. Click **Create access key**
3. Choose **Application running outside AWS**
4. **Copy both the Access Key ID and Secret Access Key**

## Step 2: Get Your AWS Resource Information

### 2.1 Get S3 Bucket Name
```bash
# List your S3 buckets
aws s3 ls

# Or get it from CloudFormation if you used CDK
aws cloudformation describe-stacks --stack-name YOUR-STACK-NAME --query "Stacks[0].Outputs[?OutputKey=='S3BucketName'].OutputValue" --output text
```

### 2.2 Get CloudFront Distribution ID
```bash
# List CloudFront distributions
aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='YOUR-DISTRIBUTION-COMMENT'].Id" --output text

# Or get it from CloudFormation if you used CDK
aws cloudformation describe-stacks --stack-name YOUR-STACK-NAME --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text
```

## Step 3: Configure GitHub Secrets

### 3.1 Go to Your Repository Settings
1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**

### 3.2 Add Repository Secrets
Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `AWS_ACCESS_KEY_ID` | Your IAM user's Access Key ID |
| `AWS_SECRET_ACCESS_KEY` | Your IAM user's Secret Access Key |
| `S3_BUCKET_NAME` | Your S3 bucket name (e.g., `my-frontend-bucket`) |
| `CLOUDFRONT_DISTRIBUTION_ID` | Your CloudFront distribution ID (e.g., `E1234567890ABC`) |

## Step 4: Test the Workflow

### 4.1 Push Changes
1. Make a small change to your frontend code
2. Commit and push to your main branch:
   ```bash
   git add .
   git commit -m "test: trigger CI/CD workflow"
   git push origin main
   ```

### 4.2 Monitor the Workflow
1. Go to your GitHub repository
2. Click **Actions** tab
3. You should see the "Deploy Frontend to CloudFront" workflow running
4. Click on it to see the detailed logs

## Step 5: Verify Deployment

1. Wait for the workflow to complete (usually 2-3 minutes)
2. Check your CloudFront URL to see the updated site
3. CloudFront cache invalidation may take 5-10 minutes

## Troubleshooting

### Common Issues

#### 1. Permission Denied Errors
- Check that your IAM user has the correct permissions
- Verify the S3 bucket name and CloudFront distribution ID
- Ensure the access keys are correct

#### 2. Build Failures
- Check the build logs in GitHub Actions
- Ensure all dependencies are properly installed
- Verify the environment variables are set correctly

#### 3. CloudFront Not Updated
- CloudFront cache invalidation can take time
- Check the invalidation status in AWS Console
- Verify the distribution ID is correct

### Debug Commands

```bash
# Check S3 bucket contents
aws s3 ls s3://YOUR-BUCKET-NAME

# Check CloudFront distribution status
aws cloudfront get-distribution --id YOUR-DISTRIBUTION-ID

# List recent invalidations
aws cloudfront list-invalidations --distribution-id YOUR-DISTRIBUTION-ID
```

## Security Best Practices

1. **Use Custom IAM Policies**: Instead of full access policies, create specific permissions
2. **Rotate Access Keys**: Regularly rotate your AWS access keys
3. **Monitor Usage**: Set up CloudTrail to monitor API usage
4. **Use OIDC**: For production, consider using OIDC instead of access keys

## Next Steps

- Set up branch protection rules
- Add environment-specific deployments (staging/production)
- Configure Slack/Discord notifications
- Add performance monitoring

Your CI/CD pipeline is now ready! Every push to main/master will automatically deploy your frontend to CloudFront. 