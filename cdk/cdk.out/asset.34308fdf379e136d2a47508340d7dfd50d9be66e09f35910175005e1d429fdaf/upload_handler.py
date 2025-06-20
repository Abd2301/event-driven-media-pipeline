import json
import os
import uuid
import boto3
from datetime import datetime
from typing import Dict, Any

s3_client = boto3.client('s3')
sqs_client = boto3.client('sqs')
dynamodb = boto3.resource('dynamodb')


def generate_presigned_url(bucket: str, key: str, expiration: int = 3600) -> str:
    """Generate a pre-signed URL for S3 upload."""
    return s3_client.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': bucket,
            'Key': key,
            'ContentType': 'application/octet-stream'
        },
        ExpiresIn=expiration
    )


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    # ✅ Handle CORS preflight requests
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS,POST",
                "Access-Control-Allow-Headers": "*"
            },
            "body": json.dumps("Preflight OK"),
        }

    try:
        body = json.loads(event.get('body', '{}'))
        file_name = body.get('fileName')
        content_type = body.get('contentType')

        if not file_name or not content_type:
            return {
                'statusCode': 400,
                'headers': {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "OPTIONS,POST",
                    "Access-Control-Allow-Headers": "*"
                },
                'body': json.dumps({
                    'error': 'Missing required fields: fileName and contentType'
                })
            }

        media_id = str(uuid.uuid4())
        s3_key = f"{media_id}/{file_name}"

        presigned_url = generate_presigned_url(
            os.environ['ORIGINAL_BUCKET'],
            s3_key
        )

        table = dynamodb.Table(os.environ['METADATA_TABLE'])
        table.put_item(
            Item={
                'mediaId': media_id,
                'fileName': file_name,
                'contentType': content_type,
                'originalKey': s3_key,
                'status': 'PENDING',
                'createdAt': datetime.utcnow().isoformat(),
                'processedAt': None
            }
        )

        sqs_client.send_message(
            QueueUrl=os.environ['PROCESSING_QUEUE_URL'],
            MessageBody=json.dumps({
                'mediaId': media_id,
                's3Key': s3_key,
                'contentType': content_type
            })
        )

        return {
            'statusCode': 200,
            'headers': {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS,POST",
                "Access-Control-Allow-Headers": "*"
            },
            'body': json.dumps({
                'mediaId': media_id,
                'uploadUrl': presigned_url,
                'expiresIn': 3600
            })
        }

    except Exception as e:
        print(f"Error processing upload request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS,POST",
                "Access-Control-Allow-Headers": "*"
            },
            'body': json.dumps({
                'error': 'Internal server error'
            })
        }
