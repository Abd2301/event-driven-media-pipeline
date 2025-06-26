"""
Health Check Handler Lambda Function
Provides health check endpoint for API monitoring
"""

import json
import os
from datetime import datetime, timezone
from typing import Dict, Any

import boto3


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Health check handler for API monitoring.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response with health status
    """
    try:
        # Basic health check
        health_status = {
            'status': 'healthy',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'environment': os.environ.get('ENVIRONMENT', 'unknown'),
            'service': 'Task Management API',
            'version': '1.0.0'
        }
        
        # Check DynamoDB connectivity (optional)
        try:
            if 'TASKS_TABLE' in os.environ:
                dynamodb = boto3.resource('dynamodb')
                table = dynamodb.Table(os.environ['TASKS_TABLE'])
                
                # Simple table description to test connectivity
                table.load()
                health_status['database'] = 'connected'
            else:
                health_status['database'] = 'not_configured'
                
        except Exception as db_error:
            health_status['database'] = 'error'
            health_status['database_error'] = str(db_error)
        
        # Check Lambda context
        if context:
            health_status['lambda'] = {
                'function_name': context.function_name,
                'function_version': context.function_version,
                'memory_limit': context.memory_limit_in_mb,
                'remaining_time': context.get_remaining_time_in_millis()
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET,OPTIONS'
            },
            'body': json.dumps(health_status)
        }
        
    except Exception as e:
        # Return error response if health check fails
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET,OPTIONS'
            },
            'body': json.dumps({
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            })
        } 