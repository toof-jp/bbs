resource "aws_s3_bucket" "oekaki_images" {
  bucket = var.bucket_name

  tags = {
    Name        = "Oekaki Images"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "oekaki_images" {
  bucket = aws_s3_bucket.oekaki_images.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "oekaki_images" {
  bucket = aws_s3_bucket.oekaki_images.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.oekaki_images.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_cors_configuration" "oekaki_images" {
  bucket = aws_s3_bucket.oekaki_images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = []
    max_age_seconds = 3000
  }
}