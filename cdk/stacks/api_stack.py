"""
API Stack for Serverless Task Management API
Contains: API Gateway, Lambda functions, DynamoDB, IAM roles, and monitoring
"""

import os
from typing import Optional
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_apigateway as apigateway,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_logs as logs,
)
from constructs import Construct


class ApiStack(Stack):
    """Main stack for the serverless task management API."""

    def __init__(
        self, 
        scope: Construct, 
        construct_id: str, 
        env_name: str = "dev",
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.env_name = env_name
        
        # Create infrastructure components
        self._create_database()
        self._create_lambda_functions()
        self._create_api_gateway()
        self._create_iam_roles()
        self._create_outputs()

    def _create_database(self):
        """Create DynamoDB table for tasks."""
        
        self.tasks_table = dynamodb.Table(
            self, "TasksTable",
            table_name=f"tasks-{self.env_name}",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY if self.env_name == "dev" else RemovalPolicy.RETAIN,
            point_in_time_recovery_specification=dynamodb.PointInTimeRecoverySpecification(
                point_in_time_recovery_enabled=True
            ),
            time_to_live_attribute="ttl"
        )

        # Add GSI for status queries
        self.tasks_table.add_global_secondary_index(
            index_name="StatusIndex",
            partition_key=dynamodb.Attribute(
                name="status",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_at",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL
        )

    def _create_lambda_functions(self):
        """Create Lambda functions for API handlers."""
        
        # Shared Lambda layer for common utilities
        self.shared_layer = lambda_.LayerVersion(
            self, "SharedLayer",
            layer_version_name=f"task-api-shared-{self.env_name}",
            code=lambda_.Code.from_asset("../src/utils"),
            compatible_runtimes=[lambda_.Runtime.PYTHON_3_9],
            description="Shared utilities for task API Lambda functions"
        )

        # Task handler Lambda
        self.task_handler = lambda_.Function(
            self, "TaskHandler",
            function_name=f"task-handler-{self.env_name}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="task_handler.lambda_handler",
            code=lambda_.Code.from_asset("../src/handlers"),
            layers=[self.shared_layer],
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "TASKS_TABLE": self.tasks_table.table_name,
                "ENVIRONMENT": self.env_name
            },
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        # Health check Lambda
        self.health_handler = lambda_.Function(
            self, "HealthHandler",
            function_name=f"health-handler-{self.env_name}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="health_handler.lambda_handler",
            code=lambda_.Code.from_asset("../src/handlers"),
            layers=[self.shared_layer],
            timeout=Duration.seconds(10),
            memory_size=128,
            environment={
                "ENVIRONMENT": self.env_name
            },
            log_retention=logs.RetentionDays.ONE_WEEK
        )

    def _create_api_gateway(self):
        """Create API Gateway with REST API endpoints."""
        
        # API Gateway
        self.api = apigateway.RestApi(
            self, "TaskAPI",
            rest_api_name=f"task-management-api-{self.env_name}",
            description="Serverless Task Management API",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["*"],
                max_age=Duration.seconds(300)
            ),
            deploy_options=apigateway.StageOptions(
                stage_name=self.env_name,
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
                logging_level=apigateway.MethodLoggingLevel.OFF,
                data_trace_enabled=False
            )
        )

        # Create API resources and methods
        self._create_api_resources()

    def _create_api_resources(self):
        """Create API Gateway resources and methods."""
        
        # Task handler integration
        task_integration = apigateway.LambdaIntegration(
            self.task_handler,
            request_templates={
                "application/json": '{"body": $input.json("$")}'
            }
        )

        # Health handler integration
        health_integration = apigateway.LambdaIntegration(
            self.health_handler,
            request_templates={
                "application/json": '{"body": {}}'
            }
        )

        # Tasks resource
        tasks_resource = self.api.root.add_resource("tasks")
        
        # POST /tasks - Create task
        tasks_resource.add_method(
            "POST",
            task_integration,
            request_validator=apigateway.RequestValidator(
                self, "CreateTaskValidator",
                rest_api=self.api,
                validate_request_body=True,
                validate_request_parameters=False
            ),
            request_models={
                "application/json": apigateway.Model.EMPTY_MODEL
            }
        )
        
        # GET /tasks - List tasks
        tasks_resource.add_method("GET", task_integration)

        # Individual task resource
        task_resource = tasks_resource.add_resource("{id}")
        
        # GET /tasks/{id} - Get task
        task_resource.add_method("GET", task_integration)
        
        # PUT /tasks/{id} - Update task
        task_resource.add_method(
            "PUT",
            task_integration,
            request_validator=apigateway.RequestValidator(
                self, "UpdateTaskValidator",
                rest_api=self.api,
                validate_request_body=True,
                validate_request_parameters=False
            ),
            request_models={
                "application/json": apigateway.Model.EMPTY_MODEL
            }
        )
        
        # DELETE /tasks/{id} - Delete task
        task_resource.add_method("DELETE", task_integration)

        # Health check resource
        health_resource = self.api.root.add_resource("health")
        health_resource.add_method("GET", health_integration)

    def _create_iam_roles(self):
        """Create IAM roles and policies for Lambda functions."""
        
        # Grant DynamoDB permissions to task handler
        self.tasks_table.grant_read_write_data(self.task_handler)
        
        # Grant read permissions to health handler (if needed)
        # self.tasks_table.grant_read_data(self.health_handler)

    def _create_outputs(self):
        """Create CloudFormation outputs for important resources."""
        
        CfnOutput(
            self, "APIEndpoint",
            value=self.api.url,
            description="API Gateway endpoint URL",
            export_name=f"{self.stack_name}-APIEndpoint"
        )

        CfnOutput(
            self, "TasksTableName",
            value=self.tasks_table.table_name,
            description="DynamoDB table for tasks",
            export_name=f"{self.stack_name}-TasksTable"
        )

        CfnOutput(
            self, "TaskHandlerFunction",
            value=self.task_handler.function_name,
            description="Lambda function for task operations",
            export_name=f"{self.stack_name}-TaskHandler"
        )

        CfnOutput(
            self, "HealthHandlerFunction",
            value=self.health_handler.function_name,
            description="Lambda function for health checks",
            export_name=f"{self.stack_name}-HealthHandler"
        ) 