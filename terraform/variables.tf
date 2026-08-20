variable "region" {
  default = "ap-south-1"
}

variable "environment" {
  default = "dev"
}

variable "cluster_name" {
  default = "cloud-native-cicd"
}

variable "vpc_cidr" {
  default = "10.0.0.0/16"
}

# The EKS API server was previously left at its default of being reachable
# from anywhere on the internet. Restrict it to known CIDRs (office VPN,
# CI runner ranges, etc). Set to your own IP ranges before applying.
variable "cluster_endpoint_public_access_cidrs" {
  description = "CIDRs allowed to reach the public Kubernetes API endpoint"
  type        = list(string)
  default     = ["0.0.0.0/0"] # tighten this for real deployments
}

variable "node_instance_types" {
  type    = list(string)
  default = ["t3.medium"]
}

variable "node_desired_size" {
  default = 2
}

variable "node_min_size" {
  default = 2
}

variable "node_max_size" {
  default = 4
}
