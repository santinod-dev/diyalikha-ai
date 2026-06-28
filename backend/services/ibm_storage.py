from __future__ import annotations
import os
import ibm_boto3
from ibm_botocore.client import Config

COS_API_KEY          = os.environ["COS_API_KEY"]
COS_INSTANCE_CRN     = os.environ["COS_INSTANCE_CRN"]
COS_ENDPOINT         = os.environ.get("COS_ENDPOINT", "https://s3.ap-au-syd.cloud-object-storage.appdomain.cloud")
COS_BUCKET           = os.environ.get("COS_BUCKET", "diyalikha-uploads")

_cos_client = None

def _get_client():
    global _cos_client
    if _cos_client is None:
        _cos_client = ibm_boto3.client(
            "s3",
            ibm_api_key_id=COS_API_KEY,
            ibm_service_instance_id=COS_INSTANCE_CRN,
            config=Config(signature_version="oauth"),
            endpoint_url=COS_ENDPOINT,
        )
    return _cos_client


async def upload_file(uid: str, filename: str, data: bytes, content_type: str) -> str:
    """
    Uploads raw bytes to IBM COS at users/{uid}/uploads/{filename}.
    Returns a pre-signed URL valid for 7 days.
    """
    import asyncio
    key = f"users/{uid}/uploads/{filename}"
    client = _get_client()

    # boto3 upload is synchronous — run in thread pool
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: client.put_object(
            Bucket=COS_BUCKET,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
    )

    # Generate a pre-signed URL valid for 7 days
    url = await loop.run_in_executor(
        None,
        lambda: client.generate_presigned_url(
            "get_object",
            Params={"Bucket": COS_BUCKET, "Key": key},
            ExpiresIn=604800,  # 7 days in seconds
        )
    )
    return url
