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

# Deploy S3 bucket and CloudFront
deploy: init
	terraform apply -auto-approve

# Show outputs
outputs:
	terraform output

# Show AWS credentials for crawler
show-credentials:
	@echo "AWS_ACCESS_KEY_ID=$$(terraform output -raw crawler_access_key_id)"
	@echo "AWS_SECRET_ACCESS_KEY=$$(terraform output -raw crawler_secret_access_key)"
	@echo "AWS_REGION=$$(terraform output -raw aws_region 2>/dev/null || echo 'ap-northeast-1')"
	@echo "BUCKET_NAME=$$(terraform output -raw bucket_name)"

# Clean up Terraform files
clean:
	rm -rf .terraform
	rm -f .terraform.lock.hcl
	rm -f terraform.tfstate*