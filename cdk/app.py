#!/usr/bin/env python3
import os
from aws_cdk.aws_apigateway import RestApi, LambdaIntegration, MethodOptions, AuthorizationType, CorsOptions, ApiKeySourceType, UsagePlan, UsagePlanPerApiStage, RequestValidator, RequestValidatorOptions, JsonSchemaType, JsonSchema, Model, MethodResponse, IntegrationResponse, Period, ApiKey
from aws_cdk import (
    App,
    Environment,
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
)
from aws_cdk.aws_s3 import (
    Bucket,
    CorsRule,
    HttpMethods,
    LifecycleRule,
    EventType,
)
from aws_cdk.aws_sqs import (
    Queue,
    DeadLetterQueue,
)
from aws_cdk.aws_dynamodb import (
    Table,
    AttributeType,
    BillingMode,
    ProjectionType,
)
from aws_cdk.aws_lambda import (
    Runtime,
    Architecture,
    LayerVersion,
    Code,
    LoggingFormat,
)
from aws_cdk.aws_lambda_python_alpha import (
    PythonFunction,
)
from aws_cdk.aws_s3_notifications import SqsDestination
from aws_cdk.aws_cloudwatch import (
    Alarm,
    Metric,
    Dashboard,
    GraphWidget,
    TextWidget,
    AlarmStatusWidget,
)
from aws_cdk.aws_cloudwatch_actions import SnsAction
from aws_cdk.aws_sns import Topic
from aws_cdk.aws_sns_subscriptions import EmailSubscription
from constructs import Construct
import secrets

class MediaProcessingStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create SNS Topic for alarms
        alarm_topic = Topic(
            self, "MediaProcessingAlarms",
            topic_name=f"{os.getenv('ENVIRONMENT', 'dev')}-media-processing-alarms",
        )

        # Create S3 buckets
        original_bucket = Bucket(
            self, "OriginalMediaBucket",
            bucket_name=f"{os.getenv('ENVIRONMENT', 'dev')}-original-media-{self.account}",
            cors=[
                CorsRule(
                    allowed_methods=[HttpMethods.GET, HttpMethods.PUT, HttpMethods.POST, HttpMethods.DELETE],
                    allowed_origins=["*"],
                    allowed_headers=["*"],
                    max_age=3000,
                )
            ],
            lifecycle_rules=[
                LifecycleRule(
                    expiration=Duration.days(90),
                    enabled=True,
                )
            ],
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        processed_bucket = Bucket(
            self, "ProcessedMediaBucket",
            bucket_name=f"{os.getenv('ENVIRONMENT', 'dev')}-processed-media-{self.account}",
            cors=[
                CorsRule(
                    allowed_methods=[HttpMethods.GET],
                    allowed_origins=["*"],
                    allowed_headers=["*"],
                    max_age=3000,
                )
            ],
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        # Create SQS Queue with DLQ
        dlq = Queue(
            self, "MediaProcessingDLQ",
            queue_name=f"{os.getenv('ENVIRONMENT', 'dev')}-media-processing-dlq",
            retention_period=Duration.days(14),
        )

        processing_queue = Queue(
            self, "MediaProcessingQueue",
            queue_name=f"{os.getenv('ENVIRONMENT', 'dev')}-media-processing-queue",
            visibility_timeout=Duration.seconds(900),
            retention_period=Duration.days(14),
            dead_letter_queue=DeadLetterQueue(
                queue=dlq,
                max_receive_count=3,
            ),
        )

        # Create DynamoDB table
        metadata_table = Table(
            self, "MediaMetadataTable",
            table_name=f"{os.getenv('ENVIRONMENT', 'dev')}-media-metadata",
            billing_mode=BillingMode.PAY_PER_REQUEST,
            partition_key={"name": "mediaId", "type": AttributeType.STRING},
            removal_policy=RemovalPolicy.DESTROY,
        )

        metadata_table.add_global_secondary_index(
            index_name="ProcessedAtIndex",
            partition_key={"name": "processedAt", "type": AttributeType.STRING},
            projection_type=ProjectionType.ALL,
        )

        # Create Lambda Layer for shared dependencies
        shared_layer = LayerVersion(
            self, "SharedLayer",
            code=Code.from_asset("../src/utils"),
            compatible_runtimes=[Runtime.PYTHON_3_10],
            description="Shared dependencies for media processing",
        )

        # Create Lambda functions with enhanced logging
        image_processor = PythonFunction(
            self, "ImageProcessorFunction",
            entry="../src/processors",
            runtime=Runtime.PYTHON_3_10,
            architecture=Architecture.X86_64,
            index="image_processor.py",
            handler="lambda_handler",
            timeout=Duration.seconds(900),
            memory_size=1024,
            environment={
                "ENVIRONMENT": os.getenv("ENVIRONMENT", "dev"),
                "DYNAMODB_TABLE": metadata_table.table_name,
                "PROCESSED_BUCKET": processed_bucket.bucket_name,
            },
            layers=[shared_layer],
            logging_format=LoggingFormat.JSON,
        )

        # API Lambda functions with enhanced logging
        upload_handler = PythonFunction(
            self, "UploadHandlerFunction",
            entry="../src/api",
            runtime=Runtime.PYTHON_3_10,
            architecture=Architecture.X86_64,
            index="upload_handler.py",
            handler="lambda_handler",
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "ENVIRONMENT": os.getenv("ENVIRONMENT", "dev"),
                "ORIGINAL_BUCKET": original_bucket.bucket_name,
                "PROCESSING_QUEUE_URL": processing_queue.queue_url,
                "METADATA_TABLE": metadata_table.table_name,
            },
            layers=[shared_layer],
            logging_format=LoggingFormat.JSON,
        )

        status_handler = PythonFunction(
            self, "StatusHandlerFunction",
            entry="../src/api",
            runtime=Runtime.PYTHON_3_10,
            architecture=Architecture.X86_64,
            index="status_handler.py",
            handler="lambda_handler",
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "ENVIRONMENT": os.getenv("ENVIRONMENT", "dev"),
                "METADATA_TABLE": metadata_table.table_name,
                "PROCESSED_BUCKET": processed_bucket.bucket_name,
            },
            layers=[shared_layer],
            logging_format=LoggingFormat.JSON,
        )

        # Create API Gateway with security features
        api = RestApi(
            self, "MediaProcessingApi",
            rest_api_name=f"{os.getenv('ENVIRONMENT', 'dev')}-media-processing-api",
            description="API for media processing pipeline",
            api_key_source_type=ApiKeySourceType.HEADER,
            default_method_options=MethodOptions(
                api_key_required=True,
            ),
        )

        # Create request validator
        request_validator = RequestValidator(
            self, "RequestValidator",
            rest_api=api,
            request_validator_name="RequestValidator",
            validate_request_body=True,
            validate_request_parameters=True,
        )

        # Create JSON schema for upload request
        upload_model = Model(
            self, "UploadModel",
            rest_api=api,
            model_name="UploadRequest",
            schema=JsonSchema(
                type=JsonSchemaType.OBJECT,
                required=["fileName", "contentType"],
                properties={
                    "fileName": JsonSchema(
                        type=JsonSchemaType.STRING,
                        min_length=1,
                        max_length=255,
                    ),
                    "contentType": JsonSchema(
                        type=JsonSchemaType.STRING,
                        enum=["image/jpeg", "image/png", "image/gif"],
                    ),
                },
            ),
        )

        # Create JSON schema for status response
        status_model = Model(
            self, "StatusModel",
            rest_api=api,
            model_name="StatusResponse",
            schema=JsonSchema(
                type=JsonSchemaType.OBJECT,
                required=["status", "mediaId"],
                properties={
                    "status": JsonSchema(
                        type=JsonSchemaType.STRING,
                        enum=["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
                    ),
                    "mediaId": JsonSchema(
                        type=JsonSchemaType.STRING,
                    ),
                    "processedUrl": JsonSchema(
                        type=JsonSchemaType.STRING,
                    ),
                    "error": JsonSchema(
                        type=JsonSchemaType.STRING,
                    ),
                },
            ),
        )

        # Create API resources and methods with validation
        media = api.root.add_resource("media")
        
        # POST /media/upload
        upload = media.add_resource("upload")
        upload.add_method(
            "POST",
            LambdaIntegration(
                upload_handler,
                proxy=True,
                integration_responses=[
                    IntegrationResponse(
                        status_code="200",
                        response_parameters={
                            "method.response.header.Access-Control-Allow-Origin": "'*'",
                        },
                    ),
                ],
            ),
            method_responses=[
                MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True,
                    },
                    response_models={
                        "application/json": status_model,
                    },
                ),
            ],
            request_validator=request_validator,
            request_models={
                "application/json": upload_model,
            },
        )

        # GET /media/{mediaId}/status
        status = media.add_resource("{mediaId}").add_resource("status")
        status.add_method(
            "GET",
            LambdaIntegration(
                status_handler,
                proxy=True,
                integration_responses=[
                    IntegrationResponse(
                        status_code="200",
                        response_parameters={
                            "method.response.header.Access-Control-Allow-Origin": "'*'",
                        },
                    ),
                ],
            ),
            method_responses=[
                MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True,
                    },
                    response_models={
                        "application/json": status_model,
                    },
                ),
            ],
            request_validator=request_validator,
        )

        # Add CORS to all resources
        for resource in [media, upload, status]:
            resource.add_cors_preflight(
                allow_origins=["*"],
                allow_methods=["GET", "POST", "PUT", "DELETE"],
                allow_headers=["*"],
                max_age=Duration.days(1),
            )

        # Create API Key and Usage Plan
        api_key_value = secrets.token_urlsafe(32)
        api_key = ApiKey(
            self,
            "MediaProcessingApiKey",
            api_key_name="MediaProcessingKey",
            value=api_key_value,
            description="API Key for media processing access",
            enabled=True,
        )

        usage_plan = UsagePlan(
            self, "UsagePlan",
            name=f"{os.getenv('ENVIRONMENT', 'dev')}-media-processing-usage-plan",
            api_stages=[
                UsagePlanPerApiStage(
                    api=api,
                    stage=api.deployment_stage,
                ),
            ],
            throttle={
                "rate_limit": 100,
                "burst_limit": 200,
            },
            quota={
                "limit": 10000,
                "period": Period.DAY,
            },
        )

        usage_plan.add_api_key(api_key)

        # Create CloudWatch Alarms
        # Lambda Error Rate Alarm
        lambda_error_alarm = Alarm(
            self, "LambdaErrorRateAlarm",
            metric=Metric(
                namespace="AWS/Lambda",
                metric_name="Errors",
                dimensions_map={
                    "FunctionName": image_processor.function_name,
                },
                statistic="Sum",
                period=Duration.minutes(5),
            ),
            threshold=1,
            evaluation_periods=1,
            alarm_description="Alarm when Lambda function has errors",
        )
        lambda_error_alarm.add_alarm_action(SnsAction(alarm_topic))

        # SQS Queue Age Alarm
        queue_age_alarm = Alarm(
            self, "QueueAgeAlarm",
            metric=Metric(
                namespace="AWS/SQS",
                metric_name="ApproximateAgeOfOldestMessage",
                dimensions_map={
                    "QueueName": processing_queue.queue_name,
                },
                statistic="Maximum",
                period=Duration.minutes(5),
            ),
            threshold=300,  # 5 minutes
            evaluation_periods=1,
            alarm_description="Alarm when messages are stuck in queue",
        )
        queue_age_alarm.add_alarm_action(SnsAction(alarm_topic))

        # DLQ Message Count Alarm
        dlq_alarm = Alarm(
            self, "DLQMessageCountAlarm",
            metric=Metric(
                namespace="AWS/SQS",
                metric_name="ApproximateNumberOfMessagesVisible",
                dimensions_map={
                    "QueueName": dlq.queue_name,
                },
                statistic="Sum",
                period=Duration.minutes(5),
            ),
            threshold=0,
            evaluation_periods=1,
            alarm_description="Alarm when messages are sent to DLQ",
        )
        dlq_alarm.add_alarm_action(SnsAction(alarm_topic))

        # Create CloudWatch Dashboard
        dashboard = Dashboard(
            self, "MediaProcessingDashboard",
            dashboard_name=f"{os.getenv('ENVIRONMENT', 'dev')}-media-processing-dashboard",
        )

        # Add widgets to dashboard
        dashboard.add_widgets(
            TextWidget(
                markdown="# Media Processing Pipeline Overview",
                height=1,
                width=24,
            ),
            GraphWidget(
                title="Lambda Function Metrics",
                left=[
                    Metric(
                        namespace="AWS/Lambda",
                        metric_name="Invocations",
                        dimensions_map={"FunctionName": image_processor.function_name},
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                    Metric(
                        namespace="AWS/Lambda",
                        metric_name="Errors",
                        dimensions_map={"FunctionName": image_processor.function_name},
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                ],
                width=12,
            ),
            GraphWidget(
                title="SQS Queue Metrics",
                left=[
                    Metric(
                        namespace="AWS/SQS",
                        metric_name="ApproximateNumberOfMessagesVisible",
                        dimensions_map={"QueueName": processing_queue.queue_name},
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                    Metric(
                        namespace="AWS/SQS",
                        metric_name="ApproximateAgeOfOldestMessage",
                        dimensions_map={"QueueName": processing_queue.queue_name},
                        statistic="Maximum",
                        period=Duration.minutes(5),
                    ),
                ],
                width=12,
            ),
            AlarmStatusWidget(
                title="Alarms",
                alarms=[lambda_error_alarm, queue_age_alarm, dlq_alarm],
                width=24,
            ),
        )

        # Grant permissions
        original_bucket.grant_read(image_processor)
        processed_bucket.grant_read_write(image_processor)
        metadata_table.grant_read_write_data(image_processor)
        processing_queue.grant_consume_messages(image_processor)

        # Grant API Lambda permissions
        original_bucket.grant_read_write(upload_handler)
        processing_queue.grant_send_messages(upload_handler)
        metadata_table.grant_read_write_data(upload_handler)
        metadata_table.grant_read_data(status_handler)
        processed_bucket.grant_read(status_handler)

        # Add S3 event notification
        original_bucket.add_event_notification(
            EventType.OBJECT_CREATED,
            SqsDestination(processing_queue),
        )

        # Outputs
        CfnOutput(
            self, "OriginalBucketName",
            value=original_bucket.bucket_name,
            description="Name of the original media bucket",
        )

        CfnOutput(
            self, "ProcessedBucketName",
            value=processed_bucket.bucket_name,
            description="Name of the processed media bucket",
        )

        CfnOutput(
            self, "ProcessingQueueURL",
            value=processing_queue.queue_url,
            description="URL of the media processing queue",
        )

        CfnOutput(
            self, "MetadataTableName",
            value=metadata_table.table_name,
            description="Name of the media metadata table",
        )

        CfnOutput(
            self, "ApiEndpoint",
            value=api.url,
            description="API Gateway endpoint URL",
        )

        CfnOutput(
            self, "DashboardURL",
            value=f"https://{self.region}.console.aws.amazon.com/cloudwatch/home?region={self.region}#dashboards:name={os.getenv('ENVIRONMENT', 'dev')}-media-processing-dashboard",
            description="CloudWatch Dashboard URL",
        )

        CfnOutput(
            self, "ApiKeyValue",
            value=api_key_value,
            description="API Key Value for authentication",
        )

        CfnOutput(
            self, "ApiKeyValue",
            value=api_key.key_value,
            description="API Key Value for authentication",
        )

app = App()
MediaProcessingStack(
    app, "MediaProcessingStack",
    env=Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region=os.getenv("CDK_DEFAULT_REGION", "us-east-1"),
    ),
)
app.synth() 