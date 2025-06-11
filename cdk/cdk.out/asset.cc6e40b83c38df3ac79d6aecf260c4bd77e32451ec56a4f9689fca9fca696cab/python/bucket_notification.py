import json
import os
from typing import Dict, Any

import boto3
from botocore.exceptions import ClientError

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Custom resource handler for S3 bucket notifications.
    
    Args:
        event: CloudFormation custom resource event
        context: Lambda context
    
    Returns:
        Dict containing the response
    """
    try:
        s3_client = boto3.client('s3')
        
        if event['RequestType'] in ['Create', 'Update']:
            # Get the bucket name and queue ARN from the event
            bucket_name = event['ResourceProperties']['BucketName']
            queue_arn = event['ResourceProperties']['QueueArn']
            
            # Configure bucket notification
            s3_client.put_bucket_notification_configuration(
                Bucket=bucket_name,
                NotificationConfiguration={
                    'QueueConfigurations': [
                        {
                            'QueueArn': queue_arn,
                            'Events': ['s3:ObjectCreated:*']
                        }
                    ]
                }
            )
            
            return {
                'PhysicalResourceId': f"{bucket_name}-notification",
                'Data': {
                    'Message': 'Bucket notification configured successfully'
                }
            }
            
        elif event['RequestType'] == 'Delete':
            # Remove bucket notification on stack deletion
            bucket_name = event['ResourceProperties']['BucketName']
            s3_client.put_bucket_notification_configuration(
                Bucket=bucket_name,
                NotificationConfiguration={}
            )
            
            return {
                'PhysicalResourceId': event['PhysicalResourceId'],
                'Data': {
                    'Message': 'Bucket notification removed successfully'
                }
            }
            
    except ClientError as e:
        print(f"Error configuring bucket notification: {e}")
        raise 