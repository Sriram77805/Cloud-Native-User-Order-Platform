module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "20.24.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.28"

  vpc_id     = aws_vpc.main.id
  subnet_ids = [aws_subnet.subnet1.id, aws_subnet.subnet2.id]

  eks_managed_node_groups = {
    default = {
      desired_size   = 1
      instance_types = ["t3.micro"]
    }
  }
}