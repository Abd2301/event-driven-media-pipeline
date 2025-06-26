"""
Task Handler Lambda Function
Handles CRUD operations for tasks via API Gateway
"""

import json
import uuid
import os
from datetime import datetime, timezone
from typing import Dict, Any, Optional

import boto3
from botocore.exceptions import ClientError

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TASKS_TABLE'])


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for task operations.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response
    """
    try:
        # Extract HTTP method and path
        http_method = event.get('httpMethod', 'GET')
        path_parameters = event.get('pathParameters', {})
        
        # Route to appropriate handler
        if http_method == 'POST':
            return create_task(event)
        elif http_method == 'GET':
            if path_parameters and 'id' in path_parameters:
                return get_task(path_parameters['id'])
            else:
                return list_tasks()
        elif http_method == 'PUT':
            if path_parameters and 'id' in path_parameters:
                return update_task(path_parameters['id'], event)
            else:
                return error_response(400, "Task ID is required for updates")
        elif http_method == 'DELETE':
            if path_parameters and 'id' in path_parameters:
                return delete_task(path_parameters['id'])
            else:
                return error_response(400, "Task ID is required for deletion")
        else:
            return error_response(405, f"Method {http_method} not allowed")
            
    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        return error_response(500, "Internal server error")


def create_task(event: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new task."""
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Validate required fields
        title = body.get('title')
        if not title:
            return error_response(400, "Title is required")
        
        # Create task item
        task_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        task_item = {
            'id': task_id,
            'title': title,
            'description': body.get('description', ''),
            'status': body.get('status', 'pending'),
            'priority': body.get('priority', 'medium'),
            'created_at': now,
            'updated_at': now
        }
        
        # Add optional fields
        if 'due_date' in body:
            task_item['due_date'] = body['due_date']
        
        # Save to DynamoDB
        table.put_item(Item=task_item)
        
        return success_response(201, {
            'message': 'Task created successfully',
            'task': task_item
        })
        
    except json.JSONDecodeError:
        return error_response(400, "Invalid JSON in request body")
    except Exception as e:
        print(f"Error creating task: {str(e)}")
        return error_response(500, "Failed to create task")


def get_task(task_id: str) -> Dict[str, Any]:
    """Get a specific task by ID."""
    try:
        response = table.get_item(Key={'id': task_id})
        
        if 'Item' not in response:
            return error_response(404, "Task not found")
        
        return success_response(200, {'task': response['Item']})
        
    except Exception as e:
        print(f"Error getting task: {str(e)}")
        return error_response(500, "Failed to get task")


def list_tasks() -> Dict[str, Any]:
    """List all tasks."""
    try:
        # Get query parameters for filtering
        # In a real app, you'd add pagination and filtering here
        
        response = table.scan()
        tasks = response.get('Items', [])
        
        # Sort by creation date (newest first)
        tasks.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return success_response(200, {
            'tasks': tasks,
            'count': len(tasks)
        })
        
    except Exception as e:
        print(f"Error listing tasks: {str(e)}")
        return error_response(500, "Failed to list tasks")


def update_task(task_id: str, event: Dict[str, Any]) -> Dict[str, Any]:
    """Update an existing task."""
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Check if task exists
        existing_response = table.get_item(Key={'id': task_id})
        if 'Item' not in existing_response:
            return error_response(404, "Task not found")
        
        existing_task = existing_response['Item']
        
        # Update fields
        update_expression = "SET #updated_at = :updated_at"
        expression_values = {':updated_at': datetime.now(timezone.utc).isoformat()}
        expression_names = {'#updated_at': 'updated_at'}
        
        # Fields that can be updated
        updatable_fields = ['title', 'description', 'status', 'priority', 'due_date']
        
        for field in updatable_fields:
            if field in body:
                # Use expression attribute names for reserved keywords
                attr_name = f"#{field}"
                attr_value = f":{field}"
                update_expression += f", {attr_name} = {attr_value}"
                expression_values[attr_value] = body[field]
                expression_names[attr_name] = field
        
        # Update in DynamoDB
        table.update_item(
            Key={'id': task_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ExpressionAttributeNames=expression_names,
            ReturnValues="ALL_NEW"
        )
        
        # Get updated item
        updated_response = table.get_item(Key={'id': task_id})
        
        return success_response(200, {
            'message': 'Task updated successfully',
            'task': updated_response['Item']
        })
        
    except json.JSONDecodeError:
        return error_response(400, "Invalid JSON in request body")
    except Exception as e:
        print(f"Error updating task: {str(e)}")
        return error_response(500, "Failed to update task")


def delete_task(task_id: str) -> Dict[str, Any]:
    """Delete a task."""
    try:
        # Check if task exists
        existing_response = table.get_item(Key={'id': task_id})
        if 'Item' not in existing_response:
            return error_response(404, "Task not found")
        
        # Delete from DynamoDB
        table.delete_item(Key={'id': task_id})
        
        return success_response(200, {
            'message': 'Task deleted successfully',
            'task_id': task_id
        })
        
    except Exception as e:
        print(f"Error deleting task: {str(e)}")
        return error_response(500, "Failed to delete task")


def success_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """Create a successful API Gateway response."""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(body)
    }


def error_response(status_code: int, message: str) -> Dict[str, Any]:
    """Create an error API Gateway response."""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps({
            'error': message,
            'status_code': status_code
        })
    } 