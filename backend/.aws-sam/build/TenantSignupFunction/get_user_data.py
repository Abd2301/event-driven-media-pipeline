import json
import os
import boto3
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table(os.environ['USERS_TABLE'])

def lambda_handler(event, context):
    try:
        # Get user email from the authorizer context
        email = event['requestContext']['authorizer']['claims']['email']
        
        # Get user data from DynamoDB
        response = users_table.get_item(Key={'email': email})
        user = response.get('Item')
        
        if not user:
            return {
                'statusCode': 404,
                'body': json.dumps({'message': 'User not found'})
            }
        
        # Remove sensitive information
        user.pop('password', None)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'user': {
                    'email': user['email'],
                    'firstName': user['firstName'],
                    'lastName': user['lastName'],
                    'role': user['role'],
                    'tenantId': user['tenantId'],
                    'createdAt': user['createdAt']
                }
            })
        }
    except Exception as e:
        print(f'Get user data error: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Internal server error'})
        } 