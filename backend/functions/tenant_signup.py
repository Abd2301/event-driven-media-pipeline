import json
import os
import uuid
import bcrypt
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table(os.environ['USERS_TABLE'])
tenants_table = dynamodb.Table(os.environ['TENANTS_TABLE'])

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])
        email = body['email']
        password = body['password']
        company_name = body['companyName']
        first_name = body['firstName']
        last_name = body['lastName']
        
        # Generate tenant ID
        tenant_id = str(uuid.uuid4())
        
        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create tenant record
        tenant_item = {
            'tenantId': tenant_id,
            'companyName': company_name,
            'createdAt': datetime.utcnow().isoformat(),
            'status': 'active'
        }
        
        # Create admin user record
        user_item = {
            'email': email,
            'password': hashed_password,
            'tenantId': tenant_id,
            'firstName': first_name,
            'lastName': last_name,
            'role': 'admin',
            'createdAt': datetime.utcnow().isoformat()
        }
        
        # Save both records
        with dynamodb.batch_writer() as batch:
            batch.put_item(
                TableName=os.environ['TENANTS_TABLE'],
                Item=tenant_item
            )
            batch.put_item(
                TableName=os.environ['USERS_TABLE'],
                Item=user_item
            )
        
        return {
            'statusCode': 201,
            'body': json.dumps({
                'message': 'Tenant created successfully',
                'tenantId': tenant_id
            })
        }
    except Exception as e:
        print(f'Tenant signup error: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Internal server error'})
        } 