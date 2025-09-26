variable "email" {
  type = string
}

variable "api_key" {
  type = string
}

terraform {
  required_providers {
    upstash = {
      source  = "upstash/upstash"
      version = "~> 2.0"
    }
  }
}

provider "upstash" {
  email   = var.email
  api_key = var.api_key
}

resource "upstash_redis_database" "redis" {
  database_name  = "bbs-webhook"
  region         = "global"
  primary_region = "ap-southeast-1"
  tls            = true
}
