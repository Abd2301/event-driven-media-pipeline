#!/usr/bin/env python3
import os
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
)
from aws_cdk.aws_lambda_python_alpha import (
    PythonFunction,
    PythonLayerVersion,
)
from aws_cdk.aws_s3_notifications import SqsDestination
from constructs import Construct

class MediaProcessingStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

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
        shared_layer = PythonLayerVersion(
            self, "SharedLayer",
            entry="../src/utils",
            compatible_runtimes=[Runtime.PYTHON_3_10],
            description="Shared dependencies for media processing",
        )

        # Create Lambda function
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
        )

        # Grant permissions
        original_bucket.grant_read(image_processor)
        processed_bucket.grant_read_write(image_processor)
        metadata_table.grant_read_write_data(image_processor)
        processing_queue.grant_consume_messages(image_processor)

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

app = App()
MediaProcessingStack(
    app, "MediaProcessingStack",
    env=Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region=os.getenv("CDK_DEFAULT_REGION", "us-east-1"),
    ),
)
app.synth() 