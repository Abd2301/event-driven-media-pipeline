#!/usr/bin/env python3
"""
Serverless Task Management API - CDK App
"""

import os
from aws_cdk import App, Environment
from stacks.api_stack import ApiStack

app = App()

# Get environment from context or default to 'dev'
env_name = app.node.try_get_context('environment') or 'dev'

# Create the API stack
api_stack = ApiStack(
    app, 
    f"TaskAPI-{env_name}",
    env_name=env_name,
    env=Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region=os.getenv('CDK_DEFAULT_REGION', 'us-east-1')
    ),
    description=f"Serverless Task Management API - {env_name} environment"
)

# Add tags to all resources
app.node.add_metadata('Project', 'Task Management API')
app.node.add_metadata('Environment', env_name)
app.node.add_metadata('Owner', 'Cloud Engineer')

app.synth() 