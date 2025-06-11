import json
import os
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

import boto3
from botocore.exceptions import ClientError
from PIL import Image
import magic
import io

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

def get_file_type(file_content: bytes) -> str:
    """Detect file type using python-magic."""
    return magic.from_buffer(file_content, mime=True)

def compress_image(image: Image.Image, max_size: tuple = (1920, 1080)) -> Image.Image:
    """Compress image while maintaining aspect ratio."""
    image.thumbnail(max_size, Image.Resampling.LANCZOS)
    return image

def extract_metadata(image: Image.Image) -> Dict[str, Any]:
    """Extract basic metadata from image."""
    return {
        'width': image.width,
        'height': image.height,
        'format': image.format,
        'mode': image.mode,
    }

def save_to_s3(image: Image.Image, bucket: str, key: str, format: str = 'JPEG') -> str:
    """Save processed image to S3."""
    # Convert image to bytes
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format=format, quality=85, optimize=True)
    img_byte_arr.seek(0)
    
    # Upload to S3
    s3_client.upload_fileobj(
        img_byte_arr,
        bucket,
        key,
        ExtraArgs={'ContentType': f'image/{format.lower()}'}
    )
    return f"s3://{bucket}/{key}"

def update_metadata(media_id: str, metadata: Dict[str, Any]) -> None:
    """Update metadata in DynamoDB."""
    try:
        table.update_item(
            Key={'mediaId': media_id},
            UpdateExpression='SET metadata = :metadata, processedAt = :processedAt',
            ExpressionAttributeValues={
                ':metadata': metadata,
                ':processedAt': datetime.utcnow().isoformat()
            }
        )
    except ClientError as e:
        print(f"Error updating metadata: {e}")
        raise

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process images uploaded to S3.
    
    Args:
        event: SQS event containing S3 object information
        context: Lambda context
    
    Returns:
        Dict containing processing results
    """
    try:
        # Process each record from SQS
        for record in event['Records']:
            # Parse S3 event from SQS message
            s3_event = json.loads(record['body'])
            for s3_record in s3_event['Records']:
                bucket = s3_record['s3']['bucket']['name']
                key = s3_record['s3']['object']['key']
                
                # Generate unique ID for the media
                media_id = str(uuid.uuid4())
                
                # Download image from S3
                response = s3_client.get_object(Bucket=bucket, Key=key)
                file_content = response['Body'].read()
                
                # Verify it's an image
                file_type = get_file_type(file_content)
                if not file_type.startswith('image/'):
                    raise ValueError(f"Unsupported file type: {file_type}")
                
                # Process image
                image = Image.open(io.BytesIO(file_content))
                processed_image = compress_image(image)
                
                # Extract metadata
                metadata = extract_metadata(processed_image)
                
                # Save processed image
                processed_key = f"processed/{media_id}/{os.path.basename(key)}"
                processed_url = save_to_s3(
                    processed_image,
                    os.environ['PROCESSED_BUCKET'],
                    processed_key
                )
                
                # Update metadata in DynamoDB
                metadata.update({
                    'originalUrl': f"s3://{bucket}/{key}",
                    'processedUrl': processed_url,
                    'fileType': file_type,
                    'processingStatus': 'completed'
                })
                update_metadata(media_id, metadata)
                
                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'message': 'Image processed successfully',
                        'mediaId': media_id,
                        'metadata': metadata
                    })
                }
                
    except Exception as e:
        print(f"Error processing image: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing image',
                'error': str(e)
            })
        } 