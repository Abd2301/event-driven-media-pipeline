"""
Unit tests for task handler Lambda function
"""

import json
import pytest
from unittest.mock import patch, MagicMock
from src.handlers.task_handler import lambda_handler, create_task, get_task


@pytest.fixture
def mock_dynamodb():
    """Mock DynamoDB table."""
    with patch('src.handlers.task_handler.table') as mock_table:
        yield mock_table


def test_create_task_success(mock_dynamodb):
    """Test successful task creation."""
    event = {
        'httpMethod': 'POST',
        'body': json.dumps({
            'title': 'Test Task',
            'description': 'Test Description',
            'status': 'pending'
        })
    }
    
    with patch('src.handlers.task_handler.uuid.uuid4') as mock_uuid:
        mock_uuid.return_value = 'test-uuid-123'
        
        response = create_task(event)
        
        assert response['statusCode'] == 201
        body = json.loads(response['body'])
        assert body['message'] == 'Task created successfully'
        assert body['task']['id'] == 'test-uuid-123'
        assert body['task']['title'] == 'Test Task'
        
        # Verify DynamoDB was called
        mock_dynamodb.put_item.assert_called_once()


def test_create_task_missing_title(mock_dynamodb):
    """Test task creation with missing title."""
    event = {
        'httpMethod': 'POST',
        'body': json.dumps({
            'description': 'Test Description'
        })
    }
    
    response = create_task(event)
    
    assert response['statusCode'] == 400
    body = json.loads(response['body'])
    assert 'Title is required' in body['error']


def test_get_task_success(mock_dynamodb):
    """Test successful task retrieval."""
    task_id = 'test-uuid-123'
    mock_task = {
        'id': task_id,
        'title': 'Test Task',
        'description': 'Test Description',
        'status': 'pending'
    }
    
    mock_dynamodb.get_item.return_value = {'Item': mock_task}
    
    response = get_task(task_id)
    
    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert body['task']['id'] == task_id
    assert body['task']['title'] == 'Test Task'


def test_get_task_not_found(mock_dynamodb):
    """Test task retrieval when task doesn't exist."""
    task_id = 'non-existent-id'
    mock_dynamodb.get_item.return_value = {}
    
    response = get_task(task_id)
    
    assert response['statusCode'] == 404
    body = json.loads(response['body'])
    assert 'Task not found' in body['error']


def test_lambda_handler_post(mock_dynamodb):
    """Test lambda handler with POST method."""
    event = {
        'httpMethod': 'POST',
        'body': json.dumps({
            'title': 'Test Task',
            'description': 'Test Description'
        })
    }
    
    with patch('src.handlers.task_handler.create_task') as mock_create:
        mock_create.return_value = {'statusCode': 201, 'body': '{}'}
        
        response = lambda_handler(event, {})
        
        mock_create.assert_called_once_with(event)


def test_lambda_handler_get_tasks(mock_dynamodb):
    """Test lambda handler with GET method for listing tasks."""
    event = {
        'httpMethod': 'GET',
        'pathParameters': None
    }
    
    with patch('src.handlers.task_handler.list_tasks') as mock_list:
        mock_list.return_value = {'statusCode': 200, 'body': '{}'}
        
        response = lambda_handler(event, {})
        
        mock_list.assert_called_once()


def test_lambda_handler_get_task(mock_dynamodb):
    """Test lambda handler with GET method for single task."""
    event = {
        'httpMethod': 'GET',
        'pathParameters': {'id': 'test-uuid-123'}
    }
    
    with patch('src.handlers.task_handler.get_task') as mock_get:
        mock_get.return_value = {'statusCode': 200, 'body': '{}'}
        
        response = lambda_handler(event, {})
        
        mock_get.assert_called_once_with('test-uuid-123')


def test_lambda_handler_method_not_allowed(mock_dynamodb):
    """Test lambda handler with unsupported method."""
    event = {
        'httpMethod': 'PATCH',
        'pathParameters': None
    }
    
    response = lambda_handler(event, {})
    
    assert response['statusCode'] == 405
    body = json.loads(response['body'])
    assert 'Method PATCH not allowed' in body['error'] 