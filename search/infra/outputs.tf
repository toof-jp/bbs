output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.oekaki_images.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.oekaki_cdn.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.oekaki_cdn.id
}

output "crawler_access_key_id" {
  description = "Access key ID for the crawler user"
  value       = aws_iam_access_key.crawler.id
  sensitive   = true
}

output "crawler_secret_access_key" {
  description = "Secret access key for the crawler user"
  value       = aws_iam_access_key.crawler.secret
  sensitive   = true
}