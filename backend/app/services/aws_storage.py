import boto3
import json
import hashlib
from datetime import datetime
from app.core.config import settings

class AWSStorageService:
    def __init__(self):
        self.region = settings.AWS_REGION
        self.s3_bucket = "cloudconfig-approved-baselines"
        self.s3 = boto3.client("s3", region_name=self.region)
        self.dynamodb = boto3.resource("dynamodb", region_name=self.region)
        self.desired_state_table = self.dynamodb.Table("CloudConfig-DesiredState")
        self.drift_events_table = self.dynamodb.Table("CloudConfig-DriftEvents")

    def upload_approved_baseline(self, config_name: str, content: str, version: int, environment: str, metadata: dict = None) -> dict:
        """
        1. Uploads approved config file & metadata to Amazon S3
        2. Computes SHA-256 hash and updates DynamoDB CloudConfig-DesiredState
        """
        sha256_hash = f"sha256:{hashlib.sha256(content.encode('utf-8')).hexdigest()}"
        timestamp = datetime.utcnow().isoformat()
        
        s3_key = f"approved-baselines/{environment}/{config_name}.json"
        payload = {
            "config_name": config_name,
            "version": version,
            "environment": environment,
            "hash": sha256_hash,
            "content": content,
            "approved_at": timestamp,
            "metadata": metadata or {}
        }

        # Write to S3
        self.s3.put_object(
            Bucket=self.s3_bucket,
            Key=s3_key,
            Body=json.dumps(payload, indent=2),
            ContentType="application/json"
        )

        # Write Hash & Desired State to DynamoDB
        dynamo_item = {
            "resource_id": config_name,
            "resource_type": "config_file",
            "expected_hash": sha256_hash,
            "environment": environment,
            "version": f"v{version}",
            "updated_at": timestamp,
            "s3_uri": f"s3://{self.s3_bucket}/{s3_key}"
        }
        self.desired_state_table.put_item(Item=dynamo_item)

        return {
            "s3_uri": dynamo_item["s3_uri"],
            "hash": sha256_hash,
            "status": "synced"
        }

    def record_drift_event(self, drift_id: str, resource_id: str, expected_hash: str, actual_hash: str, severity: str = "HIGH", details: str = "") -> dict:
        """
        Records a detected PCA drift anomaly into DynamoDB CloudConfig-DriftEvents
        """
        timestamp = datetime.utcnow().isoformat()
        item = {
            "drift_id": drift_id,
            "detected_at": timestamp,
            "resource_id": resource_id,
            "expected_hash": expected_hash,
            "actual_hash": actual_hash,
            "severity": severity,
            "status": "ACTIVE",
            "details": details
        }
        self.drift_events_table.put_item(Item=item)
        return item

    def get_desired_state(self, resource_id: str, resource_type: str = "config_file"):
        """
        Queries DynamoDB in ~2ms to fetch the expected hash
        """
        response = self.desired_state_table.get_item(
            Key={
                "resource_id": resource_id,
                "resource_type": resource_type
            }
        )
        return response.get("Item")

aws_storage = AWSStorageService()
