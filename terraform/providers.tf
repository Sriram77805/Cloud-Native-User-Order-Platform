terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  required_version = ">= 1.3.0"

  # Remote state with locking - the previous version of this repo used
  # local state, which has no locking (concurrent applies can corrupt
  # state) and isn't shared across a team or CI. Create the bucket/table
  # once out of band, then uncomment:
  #
  # backend "s3" {
  #   bucket         = "cloud-native-cicd-tfstate"
  #   key            = "eks/terraform.tfstate"
  #   region         = "ap-south-1"
  #   dynamodb_table = "cloud-native-cicd-tflock"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = "cloud-native-cicd-platform"
      ManagedBy   = "terraform"
      Environment = var.environment
    }
  }
}
