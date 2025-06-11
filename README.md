# Event-Driven Media Processing Pipeline

A scalable, serverless architecture for processing media files (images/videos) using AWS services. This project demonstrates advanced cloud-native patterns and AWS best practices while staying within the Free Tier limits.

## 🏗️ Architecture

```
[Media Upload] → [S3 Bucket] → [S3 Event] → [SQS Queue] → [Lambda Processor] → [DynamoDB]
                                                              ↓
                                                         [CloudWatch]
```

### Key Components:
- **AWS S3**: Storage for original and processed media files
- **AWS Lambda**: Python-based media processing functions
- **Amazon SQS**: Message queue for decoupling and retry handling
- **DynamoDB**: Metadata storage for processed media
- **CloudWatch**: Logging and monitoring
- **IAM**: Least privilege security model

## 🚀 Features

- Automatic media processing on upload
- Image compression and format conversion
- Video transcoding (basic)
- Metadata extraction and storage
- Idempotent processing
- Error handling and retries
- Cost-effective (Free Tier compatible)

## 📋 Prerequisites

- AWS Account with Free Tier eligibility
- AWS CLI configured
- SAM CLI installed
- Python 3.10+
- Docker (for local testing)

## 🛠️ Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/event-driven-media-pipeline.git
cd event-driven-media-pipeline
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Deploy the application:
```bash
sam build
sam deploy --guided
```

## 📁 Project Structure

```
.
├── README.md
├── template.yaml          # SAM template
├── requirements.txt       # Python dependencies
├── src/
│   ├── processors/       # Lambda functions
│   │   ├── image_processor.py
│   │   └── video_processor.py
│   └── utils/           # Shared utilities
├── tests/               # Unit tests
└── .github/            # GitHub Actions workflows
```

## 💰 Cost Management

This project is designed to stay within AWS Free Tier limits:
- S3: 5GB storage, 20,000 GET requests, 2,000 PUT requests
- Lambda: 1M requests, 400,000 GB-seconds
- DynamoDB: 25 WCU, 25 RCU, 25GB storage
- SQS: 1M requests

## 🔍 Monitoring

- CloudWatch Metrics for Lambda execution
- SQS queue monitoring
- DynamoDB table metrics
- Custom application metrics

## 🧪 Testing

```bash
# Run unit tests
python -m pytest tests/

# Local testing with SAM
sam local invoke ImageProcessorFunction
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests. 