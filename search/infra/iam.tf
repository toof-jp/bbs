resource "aws_iam_user" "crawler" {
  name = "${var.bucket_name}-crawler"
  path = "/system/"

  tags = {
    Name        = "Crawler user for ${var.bucket_name}"
    Environment = var.environment
  }
}

resource "aws_iam_access_key" "crawler" {
  user = aws_iam_user.crawler.name
}

resource "aws_iam_user_policy" "crawler_s3_policy" {
  name = "${var.bucket_name}-crawler-policy"
  user = aws_iam_user.crawler.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.oekaki_images.arn}/*"
      }
    ]
  })
}