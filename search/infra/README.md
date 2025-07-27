# Search Infrastructure

This directory contains Terraform configuration for deploying the S3 infrastructure for storing oekaki images with CloudFront CDN.

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create S3 buckets, CloudFront distributions, and IAM resources

## Architecture

- **S3 Bucket**: Private bucket for storing oekaki images
- **CloudFront**: CDN for serving images with HTTPS and caching
- **IAM User**: Dedicated user for the crawler with minimal S3 permissions

## Usage

### 1. Initialize Terraform

```bash
make init
```

### 2. Deploy infrastructure

```bash
# Deploy everything (S3, CloudFront, IAM)
make apply
```

Note: CloudFront distribution creation can take 15-20 minutes.

### 3. Get credentials for the crawler

After deployment, retrieve the AWS credentials:

```bash
make show-credentials
```

This will output:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `BUCKET_NAME`

Copy these values to your crawler's `.env` file.

### 4. Configure frontend

Get the CloudFront domain:

```bash
terraform output cloudfront_domain_name
```

Set the `VITE_IMAGE_BASE_URL` in your frontend's `.env` file:

```env
VITE_IMAGE_BASE_URL=https://d1234567890.cloudfront.net
```

## Terraform Variables

Create a `terraform.tfvars` file:

```hcl
bucket_name = "your-unique-bucket-name"
aws_region  = "ap-northeast-1"
environment = "production"
```

## Security Notes

- The IAM user created has minimal permissions (only S3 access to the specific bucket)
- The S3 bucket is configured for public read access (images are meant to be publicly accessible)
- Access keys are marked as sensitive in Terraform outputs
- Never commit `.env` files or `terraform.tfvars` with real credentials

## Cleanup

To destroy all resources:

```bash
make destroy
```