import json
import os
import boto3
from typing import Dict, Any

dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

def get_presigned_url(bucket: str, key: str, expiration: int = 3600) -> str:
    """Generate a pre-signed URL for S3 download."""
    return s3_client.generate_presigned_url(
        'get_object',
        Params={
            'Bucket': bucket,
            'Key': key
        },
        ExpiresIn=expiration
    )

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle media status requests by retrieving metadata and generating pre-signed URLs for processed media.
    
    Expected path parameter: mediaId
    """
    try:
        # Get media ID from path parameters
        media_id = event.get('pathParameters', {}).get('mediaId')
        
        if not media_id:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Missing mediaId parameter'
                })
            }
        
        # Get metadata from DynamoDB
        table = dynamodb.Table(os.environ['METADATA_TABLE'])
        response = table.get_item(
            Key={
                'mediaId': media_id
            }
        )
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'body': json.dumps({
                    'error': 'Media not found'
                })
            }
        
        metadata = response['Item']
        
        # Generate pre-signed URLs for original and processed media if available
        result = {
            'mediaId': metadata['mediaId'],
            'fileName': metadata['fileName'],
            'contentType': metadata['contentType'],
            'status': metadata['status'],
            'createdAt': metadata['createdAt'],
            'processedAt': metadata.get('processedAt'),
        }
        
        # Add original media URL
        result['originalUrl'] = get_presigned_url(
            os.environ['ORIGINAL_BUCKET'],
            metadata['originalKey']
        )
        
        # Add processed media URL if available
        if metadata['status'] == 'COMPLETED' and 'processedKey' in metadata:
            result['processedUrl'] = get_presigned_url(
                os.environ['PROCESSED_BUCKET'],
                metadata['processedKey']
            )
        
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
        
    except Exception as e:
        print(f"Error retrieving media status: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error'
            })
        } 