variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "bucket_name" {
  description = "S3 bucket name for oekaki images"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}