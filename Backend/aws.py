import boto3
from botocore.config import Config


from config import (
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION,
    DYNAMODB_TABLE,
    S3_BUCKET,
    SESSION_TABLE
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
    region_name=AWS_REGION,
)

s3 = session.client("s3", config=proxy_config, region_name=AWS_REGION)
dynamodb = session.resource("dynamodb", config=proxy_config, region_name=AWS_REGION)

user_table = dynamodb.Table(DYNAMODB_TABLE)
user_session_table = dynamodb.Table(SESSION_TABLE)

buckets_response = s3.head_bucket(Bucket=S3_BUCKET)



