module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "20.24.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.29"

  vpc_id     = aws_vpc.main.id
  subnet_ids = [aws_subnet.private1.id, aws_subnet.private2.id]

  cluster_endpoint_public_access       = true
  cluster_endpoint_public_access_cidrs = var.cluster_endpoint_public_access_cidrs
  cluster_endpoint_private_access      = true

  eks_managed_node_groups = {
    default = {
      # Two AZs + min replicas >= 2 so a single node/AZ failure doesn't take
      # the whole app down - the previous config ran a single t3.micro node.
      desired_size   = var.node_desired_size
      min_size       = var.node_min_size
      max_size       = var.node_max_size
      instance_types = var.node_instance_types
      subnet_ids     = [aws_subnet.private1.id, aws_subnet.private2.id]
    }
  }
}
