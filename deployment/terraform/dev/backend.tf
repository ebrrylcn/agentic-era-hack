terraform {
  backend "gcs" {
    bucket = "qwiklabs-gcp-00-18421b519292-terraform-state"
    prefix = "agentic-era-hack/dev"
  }
}
