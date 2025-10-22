Server S3 upload notes

This project supports uploading pet images to AWS S3 or to a local `uploads/` folder when S3 is not configured.

Environment variables (server):
- MONGODB_URI - MongoDB connection string
- JWT_SECRET - JWT secret
- AWS_ACCESS_KEY_ID - (optional) AWS credentials
- AWS_SECRET_ACCESS_KEY - (optional) AWS credentials
- AWS_REGION - (optional) region
- AWS_BUCKET_NAME - (optional) if provided, S3 uploads will be used; otherwise local disk is used
- S3_ACL - (optional) only set if your bucket allows ACLs (for example `public-read`). If your bucket has "Block Public Access" enabled, leave this unset; the server will not send an `acl` parameter when uploading.

Notes:
- If AWS_BUCKET_NAME is omitted or the AWS SDK/multer-s3 packages are not present, the server will store uploads in `server/uploads/` and serve them at `http://<host>/uploads/<filename>`.
- If your S3 bucket doesn't allow ACLs and you previously saw an error like "bucket does not allow ACL", make sure `S3_ACL` is not set. If you need files to be public, consider enabling the appropriate IAM/policy or object ownership settings in your S3 bucket rather than setting an ACL.
 
Troubleshooting access denied when opening S3 object URLs
- If you see "Access Denied" when opening an S3 object URL, your bucket likely has Block Public Access enabled or the object ownership/policies prevent public objects.
- Recommended approaches:
	- Use presigned URLs (this project now generates presigned GET URLs when S3 is configured and `imageKey` is present). Presigned URLs allow temporary access without making objects public.
	- Alternatively, adjust the bucket policy or object ownership settings to allow public read access for objects you intend to serve publicly. This is an AWS configuration step and depends on your security requirements.
	- Ensure the object owner and bucket ownership settings match (if you upload with an IAM role that does not own the bucket, objects may be owned by a different AWS account and be inaccessible unless the bucket policy allows it).

If you need help with a specific AWS error/response, paste the server logs and an example object URL and I can help interpret the required bucket/policy changes.
