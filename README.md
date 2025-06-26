# Serverless Task Management API

A serverless REST API built with AWS Lambda, API Gateway, and DynamoDB for managing tasks.

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│ API Gateway  │───▶│   Lambda    │───▶│  DynamoDB   │
│             │    │              │    │             │    │             │
└─────────────┘    └──────────────┘    └─────────────┘    └─────────────┘
                          │                     │
                          ▼                     ▼
                   ┌─────────────┐    ┌─────────────┐
                   │ CloudWatch  │    │     IAM     │
                   │   Logs      │    │  Policies   │
                   └─────────────┘    └─────────────┘
```

## Features

- ✅ Create, Read, Update, Delete tasks
- ✅ Serverless architecture (pay per request)
- ✅ Automatic scaling
- ✅ Built-in monitoring and logging
- ✅ RESTful API design
- ✅ Error handling and validation
- ✅ Infrastructure as Code (AWS CDK)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tasks` | Create a new task |
| GET | `/tasks` | List all tasks |
| GET | `/tasks/{id}` | Get a specific task |
| PUT | `/tasks/{id}` | Update a task |
| DELETE | `/tasks/{id}` | Delete a task |
| GET | `/health` | Health check |

## Tech Stack

- **AWS Lambda** - Serverless compute
- **API Gateway** - REST API management
- **DynamoDB** - NoSQL database
- **AWS CDK** - Infrastructure as Code
- **Python** - Lambda runtime
- **CloudWatch** - Monitoring and logging

## Getting Started

### Prerequisites

- AWS CLI configured
- Python 3.9+
- AWS CDK CLI
- Node.js (for CDK)

### Installation

1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Deploy: `cdk deploy --all`

### Usage

After deployment, you'll get an API endpoint URL. Use it with the endpoints above.

## Project Structure

```
├── cdk/                    # Infrastructure as Code
│   ├── app.py             # CDK app entry point
│   ├── stacks/            # CloudFormation stacks
│   └── requirements.txt   # Python dependencies
├── src/                   # Lambda function code
│   ├── handlers/          # API handlers
│   ├── models/            # Data models
│   └── utils/             # Utility functions
├── tests/                 # Unit tests
└── README.md             # This file
```

## Development

### Local Testing

```bash
# Test Lambda functions locally
python -m pytest tests/

# Test API endpoints
curl -X POST https://your-api-id.execute-api.region.amazonaws.com/dev/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Task", "description": "Test Description"}'
```

### Deployment

```bash
# Deploy to dev environment
cdk deploy --all

# Deploy to production
cdk deploy --all --context environment=prod
```

## Monitoring

- CloudWatch Logs for Lambda execution logs
- CloudWatch Metrics for API Gateway and Lambda
- X-Ray for distributed tracing (optional)

## Security

- IAM roles with least privilege
- API Gateway request validation
- DynamoDB encryption at rest
- VPC endpoints (optional)

## Cost Optimization

- Lambda: Pay per request (very low cost)
- DynamoDB: On-demand billing
- API Gateway: Pay per request
- CloudWatch: Basic monitoring included

## Next Steps

- [ ] Add authentication (Cognito)
- [ ] Add file uploads (S3)
- [ ] Add caching (ElastiCache)
- [ ] Add custom domain (Route 53)
- [ ] Add CI/CD pipeline
- [ ] Add comprehensive testing 