output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.oekaki_images.id
}

output "bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.oekaki_images.bucket_domain_name
}

output "bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket"
  value       = aws_s3_bucket.oekaki_images.bucket_regional_domain_name
}