"""
Response utilities for standardized API responses
"""

import json
from typing import Dict, Any, Optional


def success_response(
    status_code: int = 200, 
    data: Any = None, 
    message: str = "Success"
) -> Dict[str, Any]:
    """
    Create a standardized success response.
    
    Args:
        status_code: HTTP status code
        data: Response data
        message: Success message
        
    Returns:
        API Gateway response dictionary
    """
    body = {
        'success': True,
        'message': message,
        'data': data
    }
    
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


def error_response(
    status_code: int = 400, 
    message: str = "Bad Request",
    error_code: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a standardized error response.
    
    Args:
        status_code: HTTP status code
        message: Error message
        error_code: Optional error code
        
    Returns:
        API Gateway response dictionary
    """
    body = {
        'success': False,
        'error': {
            'message': message,
            'code': error_code or f'HTTP_{status_code}'
        }
    }
    
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


def validation_error_response(errors: list) -> Dict[str, Any]:
    """
    Create a validation error response.
    
    Args:
        errors: List of validation errors
        
    Returns:
        API Gateway response dictionary
    """
    return error_response(
        status_code=400,
        message="Validation failed",
        error_code="VALIDATION_ERROR"
    ) 