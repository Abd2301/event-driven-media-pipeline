import json
import os
import jwt
import bcrypt
import boto3
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table(os.environ['USERS_TABLE'])

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])
        email = body['email']
        password = body['password']
        
        # Get user from DynamoDB
        response = users_table.get_item(Key={'email': email})
        user = response.get('Item')
        
        if not user:
            return {
                'statusCode': 401,
                'body': json.dumps({'message': 'Invalid credentials'})
            }
        
        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return {
                'statusCode': 401,
                'body': json.dumps({'message': 'Invalid credentials'})
            }
        
        # Generate JWT token
        token = jwt.encode(
            {
                'email': user['email'],
                'tenantId': user['tenantId'],
                'role': user['role']
            },
            os.environ['JWT_SECRET'],
            algorithm='HS256'
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'token': token,
                'user': {
                    'email': user['email'],
                    'tenantId': user['tenantId'],
                    'role': user['role']
                }
            })
        }
    except Exception as e:
        print(f'Authentication error: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Internal server error'})
        } 