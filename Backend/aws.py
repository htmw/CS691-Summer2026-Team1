import boto3
from botocore.config import Config
from decimal import Decimal

from config import (
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION1,
    AWS_REGION2,
    DYNAMODB_TABLE,
    S3_BUCKET,
    SESSION_TABLE,
    INFO_TABLE
)

proxy_config = Config(
    proxies={
        "https": "http://proxy.server:3128",
        "http": "http://proxy.server:3128",
    }
)

session = boto3.Session(
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION2,
)

s3 = session.client("s3", config=proxy_config, region_name=AWS_REGION2)
dynamodb = session.resource("dynamodb", config=proxy_config, region_name=AWS_REGION2)

user_table = dynamodb.Table(DYNAMODB_TABLE)
user_session_table = dynamodb.Table(SESSION_TABLE)
info_table = dynamodb.Table(INFO_TABLE)

buckets_response = s3.head_bucket(Bucket=S3_BUCKET)


dynamodb_east_1 = session.resource(
    "dynamodb",
    config=proxy_config,
    region_name=AWS_REGION1,
)


CATALOG_TABLE_NAMES = {
        "IAPO_Courses",
        "IAPO_Courses_Offered",
        "IAPO_Degree_Requirements",
        "IAPO_Departments",
        "IAPO_Majors",
        "IAPO_Major_Courses",
        "IAPO_Prerequisites",
        "IAPO_Semester",
        "IAPO_Student_Constraints",
    }


def to_dynamodb_safe(value):
    """Recursively convert Python floats to Decimal so boto3's DynamoDB
    serializer accepts them. DynamoDB has no native float type.
    str(value) avoids binary-float imprecision, e.g. Decimal(0.1) != Decimal("0.1")."""
    if isinstance(value, float):
        return Decimal(str(value))
    if isinstance(value, dict):
        return {k: to_dynamodb_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [to_dynamodb_safe(v) for v in value]
    return value