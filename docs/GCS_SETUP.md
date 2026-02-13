# Google Cloud Storage Setup Guide

This guide explains how to set up Google Cloud Storage for the ecommerce platform.

## Prerequisites

- Google Cloud Project
- `gcloud` CLI installed (optional, for local setup)
- GCP billing enabled

## 1. Create a GCS Bucket

### Via Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Cloud Storage** → **Buckets**
3. Click **Create Bucket**
4. Configure:
   - **Name**: `ecom-platform-assets` (or your preferred name)
   - **Location type**: Choose based on your needs (Multi-region for better availability)
   - **Storage class**: Standard
   - **Access control**: Uniform (recommended)
   - **Public access**: Configure based on your needs
     - For public product images: Allow public access
     - For private assets: Keep private and use signed URLs

### Via gcloud CLI

```bash
# Create bucket
gcloud storage buckets create gs://ecom-platform-assets \
  --location=US \
  --uniform-bucket-level-access

# Optional: Make bucket public for read access
gcloud storage buckets add-iam-policy-binding gs://ecom-platform-assets \
  --member=allUsers \
  --role=roles/storage.objectViewer
```

## 2. Set Up Authentication

### For Local Development

#### Option 1: Service Account Key (Recommended for Dev)

1. **Create a Service Account**:
   ```bash
   gcloud iam service-accounts create ecom-storage-dev \
     --display-name="Ecommerce Storage Dev"
   ```

2. **Grant Storage Permissions**:
   ```bash
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:ecom-storage-dev@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/storage.objectAdmin"
   ```

3. **Create and Download Key**:
   ```bash
   gcloud iam service-accounts keys create ~/gcs-key.json \
     --iam-account=ecom-storage-dev@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

4. **Set Environment Variable**:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="$HOME/gcs-key.json"
   ```

   Or add to your `.env` file:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcs-key.json
   ```

#### Option 2: Application Default Credentials

```bash
# Authenticate with your Google account
gcloud auth application-default login
```

### For Production (Cloud Run / GCE)

When running on Google Cloud Platform services, use **Workload Identity** or **default service accounts**:

1. **No credentials file needed** - the service will use the attached service account
2. Grant the service account the necessary permissions:
   ```bash
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:YOUR_SERVICE_ACCOUNT@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/storage.objectAdmin"
   ```

3. Leave `GOOGLE_APPLICATION_CREDENTIALS` unset in your production environment

## 3. Configure Environment Variables

Update your `.env` file:

```env
# Google Cloud Storage
GCS_BUCKET_NAME=ecom-platform-assets

# For local development with service account key
GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcs-key.json

# For production on GCP (leave commented)
# GOOGLE_APPLICATION_CREDENTIALS=
```

## 4. Test the Integration

### Check Health Endpoint

```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "ok",
    "redis": "ok",
    "storage": "ok"
  }
}
```

### Upload a Test File

```bash
# Login first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@store1.com", "password": "admin123"}' \
  -c cookies.txt

# Upload a file
curl -X POST http://localhost:3000/api/assets/upload \
  -H "X-Tenant-ID: YOUR_TENANT_ID" \
  -b cookies.txt \
  -F "file=@/path/to/image.jpg"
```

## 5. Bucket Lifecycle & Cost Optimization

### Auto-delete old files (optional)

```bash
cat > lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 365}
      }
    ]
  }
}
EOF

gcloud storage buckets update gs://ecom-platform-assets \
  --lifecycle-file=lifecycle.json
```

### Enable versioning for important assets

```bash
gcloud storage buckets update gs://ecom-platform-assets \
  --versioning
```

## 6. CORS Configuration (for direct browser uploads)

If you want to allow browser-based uploads:

```bash
cat > cors.json <<EOF
[
  {
    "origin": ["http://localhost:5173", "http://localhost:5174"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

gcloud storage buckets update gs://ecom-platform-assets \
  --cors-file=cors.json
```

## Security Best Practices

1. **Never commit service account keys** to version control
2. **Use IAM roles** with least privilege principle
3. **Enable audit logging** for production buckets
4. **Set up bucket-level permissions** rather than object-level
5. **Use signed URLs** for temporary private access
6. **Implement rate limiting** on upload endpoints
7. **Validate file types** and scan for malware

## Troubleshooting

### "Permission denied" errors

```bash
# Check current authentication
gcloud auth list

# Re-authenticate
gcloud auth application-default login

# Check service account permissions
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:YOUR_SA"
```

### Bucket not found

```bash
# List all buckets
gcloud storage buckets list

# Verify bucket name in .env matches
```

### Network errors

```bash
# Test connectivity
curl https://storage.googleapis.com/storage/v1/b/ecom-platform-assets

# Check firewall rules
gcloud compute firewall-rules list
```

## Cost Estimation

- **Storage**: ~$0.020/GB/month (Standard class)
- **Class A operations** (uploads): $0.05 per 10,000 operations
- **Class B operations** (downloads): $0.004 per 10,000 operations
- **Network egress**: Varies by destination

Use the [GCS Pricing Calculator](https://cloud.google.com/products/calculator) for accurate estimates.
