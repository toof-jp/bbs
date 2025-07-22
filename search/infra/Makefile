.PHONY: init plan apply destroy fmt validate

# Initialize Terraform
init:
	terraform init

# Format Terraform files
fmt:
	terraform fmt -recursive

# Validate Terraform configuration
validate:
	terraform validate

# Plan infrastructure changes
plan: validate
	terraform plan

# Apply infrastructure changes
apply:
	terraform apply

# Destroy infrastructure
destroy:
	terraform destroy

# Deploy S3 bucket
deploy-s3: init
	terraform apply -target=aws_s3_bucket.oekaki_images -target=aws_s3_bucket_public_access_block.oekaki_images -target=aws_s3_bucket_policy.oekaki_images -target=aws_s3_bucket_cors_configuration.oekaki_images

# Show outputs
outputs:
	terraform output

# Clean up Terraform files
clean:
	rm -rf .terraform
	rm -f .terraform.lock.hcl
	rm -f terraform.tfstate*