# HALO — Task Progress & Deployment Guide
**Project:** Halo — Real-time Multi-session Video Collaboration Platform  
**Hackathon:** DAVV E-Cell · AI for Bharat 2026  
**Author:** Kush  
**Last Updated:** 17 March 2026

---

## Legend
- `[x]` Done
- `[~]` Needs Testing — structure complete, not live-tested yet
- `[ ]` Not Started
- `[!]` Needs User Consultancy / Approval  

---

## 1. Frontend — React + Vite

### Foundation
- [x] `package.json` — all deps (React, Vite, LiveKit SDK, Framer Motion, Lucide, React Router, Axios, dayjs)
- [x] `vite.config.js` — Vite + React plugin, dev server on port 3000
- [x] `index.html` — HTML entry, Google Fonts (Inter, Space Grotesk), meta/SEO tags
- [x] `src/main.jsx` — React root mount
- [x] `src/App.jsx` — React Router setup (4 routes: `/`, `/cockpit`, `/session/:roomId`, `/report/:sessionId`)
- [x] `src/index.css` — Full design system (dark/premium/spatial, CSS variables, all utility classes, animations)

### Pages
- [!] `src/pages/LobbyPage.jsx` — Landing page: create/join room form, role selector, hero copy  
  > **UI NOT FINALIZED — needs user consultancy and approval before building final version**
- [!] `src/pages/SessionPage.jsx` — Session view: participant grid, controls bar, chat, subtitles, attention, AI card  
  > **UI NOT FINALIZED — needs user consultancy and approval before building final version**
- [!] `src/pages/CockpitPage.jsx` — Admin cockpit: all live sessions as cards, stats bar, alerts  
  > **UI NOT FINALIZED — needs user consultancy and approval before building final version**
- [!] `src/pages/ReportPage.jsx` — Post-session AI report: topics, participation, questions, follow-ups  
  > **UI NOT FINALIZED — needs user consultancy and approval before building final version**

### Components
- [~] `src/components/SubtitleTicker.jsx` — Live subtitle bar at bottom of session  
  > Structure done. **Needs testing** once Amazon Transcribe Streaming WebSocket is wired.  
  > Currently shows mock cycling phrases.
- [~] `src/components/AttentionPanel.jsx` — Sidebar with per-participant attention scores and behavioral signals  
  > Structure done. **Needs testing** with real Lambda polling endpoint.
- [~] `src/components/AISummaryCard.jsx` — Late-joiner AI summary modal  
  > Structure done. **Needs testing** once `mosaic-late-joiner-summary` Lambda is deployed.  
  > Currently shows mock summary.
- [x] `src/components/ChatPanel.jsx` — In-session chat sidebar (local state; ready to wire LiveKit DataChannel)
- [x] `src/components/ParticipantGrid.jsx` — Adaptive participant grid (1–6+ tiles), screen-share layout, annotation overlay

### LiveKit Integration
- [ ] Set `VITE_LIVEKIT_URL` and `VITE_LIVEKIT_API_KEY` in `.env` (see deploy guide below)
- [ ] Wire `LiveKitRoom`, `VideoTrack`, `AudioTrack` into `SessionPage.jsx`
- [ ] Replace mock participant list with real LiveKit room participants
- [ ] Wire LiveKit DataChannel for chat

---

## 2. Backend — AWS Lambda

### Lambda functions (prefix `mosaic-` to avoid conflicts with existing projects)

- [~] `lambda/mosaic-attention-score/index.js`  
  > Structure done. **Needs testing** with real deploy.  
  > Scores participants 0–100 from behavioral signals (camera, mic, tab visibility, mouse movement).  
  > Writes session-level score to DynamoDB `halo-sessions`.

- [~] `lambda/mosaic-late-joiner-summary/index.js`  
  > Structure done. **Needs testing** with real S3 chunks and Bedrock call.  
  > Reads transcript chunks from S3 → Bedrock Nova Lite → returns 3–5 bullet summary.

- [~] `lambda/mosaic-post-session-report/index.js`  
  > Structure done. **Needs testing** with real data.  
  > Reads full transcript from S3 → Bedrock Nova Lite → structured report → writes to DynamoDB.

### Subtitles (to be built)
- [ ] `lambda/mosaic-subtitle-token/index.js` — Issues temporary Transcribe credentials for frontend WebSocket connection  
  > Amazon Transcribe Streaming is called from the **frontend browser** using WebSocket  
  > Lambda only provides short-lived credentials; actual streaming happens client-side

---

## 3. Infrastructure — AWS

### Required AWS Resources
- [ ] **EC2 instance** (t3.small) — LiveKit server via Docker  
  > See Section §5 in deployment guide below
- [ ] **DynamoDB table:** `halo-sessions`  
  > Partition key: `sessionId` (String)
- [ ] **S3 bucket:** `halo-transcripts-kush`  
  > For storing transcript chunks per session (prefix: `{sessionId}/`)
- [ ] **S3 bucket:** `halo-frontend-kush`  
  > For hosting the built React app (static site)
- [ ] **CloudFront distribution** — CDN over S3 frontend bucket
- [ ] **API Gateway** — HTTP API wrapping the 3 Lambda endpoints
- [ ] **IAM role for Lambdas** — permissions: Bedrock, Transcribe, DynamoDB, S3
- [ ] **CloudFormation stack name:** `halo-stack`

---

## 4. AI Features

| Feature | Trigger | Powered By | Status |
|---|---|---|---|
| Live Subtitles | User toggle in session | Amazon Transcribe Streaming (WebSocket) | [ ] Not wired |
| Attention Monitoring | Host toggle → 30s poll to Lambda | Pure behavioral logic in Lambda | [~] Lambda done |
| Late Joiner Summary | Joining session >5min old | Bedrock Nova Lite + S3 transcripts | [~] Lambda done |
| Post-session Report | Host ends session | Bedrock Nova Lite + S3 transcripts | [~] Lambda done |

---

## 5. Demo Readiness Checklist

- [ ] 3 named demo rooms pre-created (Math, History, Science)
- [ ] LiveKit EC2 running and reachable
- [ ] All 3 Lambda functions deployed behind API Gateway
- [ ] DynamoDB table created
- [ ] S3 transcript bucket created
- [ ] Frontend deployed to S3 + CloudFront
- [ ] Demo run-through completed: cockpit → join room → subtitles → late joiner card → end session → report

---
---

# AWS Deployment Guide

> **⚠ Important:** All resources use the prefix `halo-` and are deployed under `halo-stack`.  
> This is completely isolated from any existing projects (e.g. VaaniSeva) in your AWS account.

---

## Prerequisites
- AWS CLI configured (`aws configure` — use your existing account)
- Node.js 18+ installed
- Docker installed (for EC2 / local LiveKit test)
- Your AWS region: **ap-south-1** (Mumbai) — change if needed

---

## Step 1: Create DynamoDB Table

```bash
aws dynamodb create-table \
  --table-name halo-sessions \
  --attribute-definitions AttributeName=sessionId,AttributeType=S \
  --key-schema AttributeName=sessionId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1
```

> **No conflict risk.** This creates a brand-new table `halo-sessions`. Your existing tables are untouched.

---

## Step 2: Create S3 Buckets

```bash
# Transcript storage bucket
aws s3 mb s3://halo-transcripts-kush --region ap-south-1

# Frontend hosting bucket
aws s3 mb s3://halo-frontend-kush --region ap-south-1

# Enable static website hosting on frontend bucket
aws s3 website s3://halo-frontend-kush \
  --index-document index.html \
  --error-document index.html
```

---

## Step 3: Create IAM Role for Lambda

```bash
# Create trust policy file
cat > /tmp/lambda-trust.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
EOF

# Create the role
aws iam create-role \
  --role-name halo-lambda-role \
  --assume-role-policy-document file:///tmp/lambda-trust.json

# Attach managed policies
aws iam attach-role-policy \
  --role-name halo-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam attach-role-policy \
  --role-name halo-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonTranscribeFullAccess

aws iam attach-role-policy \
  --role-name halo-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

aws iam attach-role-policy \
  --role-name halo-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

aws iam attach-role-policy \
  --role-name halo-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

> **Save your account ID** — you'll need it for Lambda ARNs:
> ```bash
> aws sts get-caller-identity --query Account --output text
> ```

---

## Step 4: Deploy Lambda Functions

For each Lambda function, zip and deploy:

### 4a. Attention Score Lambda
```bash
cd lambda/mosaic-attention-score
npm init -y
npm install @aws-sdk/client-dynamodb
zip -r function.zip .

aws lambda create-function \
  --function-name mosaic-attention-score \
  --runtime nodejs20.x \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/halo-lambda-role \
  --region ap-south-1 \
  --timeout 15
```

### 4b. Late Joiner Summary Lambda
```bash
cd lambda/mosaic-late-joiner-summary
npm init -y
npm install @aws-sdk/client-bedrock-runtime @aws-sdk/client-s3
zip -r function.zip .

aws lambda create-function \
  --function-name mosaic-late-joiner-summary \
  --runtime nodejs20.x \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/halo-lambda-role \
  --region ap-south-1 \
  --timeout 30

# Bedrock is in us-east-1, Lambda can call cross-region — no action needed
```

### 4c. Post-session Report Lambda
```bash
cd lambda/mosaic-post-session-report
npm init -y
npm install @aws-sdk/client-bedrock-runtime @aws-sdk/client-s3 @aws-sdk/client-dynamodb
zip -r function.zip .

aws lambda create-function \
  --function-name mosaic-post-session-report \
  --runtime nodejs20.x \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/halo-lambda-role \
  --region ap-south-1 \
  --timeout 60
```

---

## Step 5: Create API Gateway

```bash
# Create HTTP API
aws apigatewayv2 create-api \
  --name halo-api \
  --protocol-type HTTP \
  --cors-configuration AllowOrigins='*',AllowMethods='GET,POST,OPTIONS',AllowHeaders='*' \
  --region ap-south-1

# Note the ApiId from the output, then add routes:
API_ID=your-api-id

# Add Lambda integrations for each function (repeat for each Lambda)
# Use AWS Console for easier setup: API Gateway → Create HTTP API → attach all 3 Lambdas
```

> 💡 **Easiest:** Use the AWS Console → API Gateway → Create HTTP API → Add routes:
> - POST `/attention-score` → `mosaic-attention-score`
> - POST `/late-joiner-summary` → `mosaic-late-joiner-summary`
> - POST `/post-session-report` → `mosaic-post-session-report`

---

## Step 6: Launch EC2 with LiveKit

```bash
# Launch t3.small in ap-south-1
# Use Ubuntu 22.04 AMI

# After SSH into instance:
sudo apt update && sudo apt install -y docker.io docker-compose
sudo systemctl start docker

# Create docker-compose for LiveKit
mkdir halo-livekit && cd halo-livekit
cat > docker-compose.yml << 'EOF'
version: '3'
services:
  livekit:
    image: livekit/livekit-server:latest
    command: --dev --bind 0.0.0.0
    ports:
      - "7880:7880"
      - "7881:7881"
      - "7882:7882/udp"
    restart: unless-stopped
EOF

sudo docker-compose up -d
```

**EC2 Security Group — open these ports:**
- 22 (SSH)
- 7880 (LiveKit HTTP)
- 7881 (LiveKit TLS)
- 7882/UDP (LiveKit WebRTC media)

> **Cost guard:** t3.small is ~$15/month. Stop the instance after the demo.

---

## Step 7: Configure Frontend Environment

Create `src/.env` (or `.env` in project root):
```env
VITE_LIVEKIT_URL=ws://YOUR_EC2_PUBLIC_IP:7880
VITE_LIVEKIT_API_KEY=devkey
VITE_LIVEKIT_API_SECRET=secret
VITE_API_BASE_URL=https://YOUR_API_GATEWAY_URL
```

> LiveKit in `--dev` mode generates tokens automatically. For production, create a separate token service Lambda.

---

## Step 8: Build & Deploy Frontend

```bash
# Build
npm run build

# Sync to S3
aws s3 sync ./dist s3://halo-frontend-kush --delete

# Set public read (for static hosting)
aws s3api put-bucket-policy \
  --bucket halo-frontend-kush \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::halo-frontend-kush/*"
    }]
  }'
```

> Access your app at: `http://halo-frontend-kush.s3-website.ap-south-1.amazonaws.com`

---

## Step 9: (Optional) CloudFront for HTTPS

```bash
# Create CloudFront distribution pointing to S3 bucket
# Use AWS Console: CloudFront → Create Distribution → Origin: halo-frontend-kush.s3...
# This gives you HTTPS, which is required for camera/mic access in browsers
```

> ⚠ **Camera and microphone require HTTPS.** For the demo, either use CloudFront or run locally.

---

## Step 10: Enable Bedrock Model Access

1. Go to AWS Console → Bedrock → Model access
2. Enable: **Amazon Nova Lite** (`amazon.nova-lite-v1:0`)
3. Region: **us-east-1** (Nova Lite is available there)

> This is a one-click approval. Takes ~2 minutes.

---

## Verify Everything Works

```bash
# Test attention Lambda
aws lambda invoke \
  --function-name mosaic-attention-score \
  --payload '{"body":"{\"sessionId\":\"TEST01\",\"participants\":[{\"id\":\"1\",\"name\":\"Test\",\"cameraOn\":true,\"micActive\":false,\"tabVisible\":true,\"mouseMoved\":true}]}"}' \
  --region ap-south-1 \
  output.json
cat output.json
```

---

## Cost Estimate (Hackathon / Demo)
| Resource | Cost |
|---|---|
| EC2 t3.small (24h) | ~$0.60 |
| Lambda invocations | ~$0.00 (free tier) |
| DynamoDB (on-demand) | ~$0.00 |
| S3 | ~$0.00 |
| Bedrock Nova Lite (~50 calls) | ~$0.05 |
| Transcribe Streaming (~1h) | ~$0.24 |
| **Total** | **< $1** |

---

## ✅ Zero Interference Promise
- All resources named `halo-*`
- Deployed under `halo-stack` (separate from any VaaniSeva or other stacks)
- Uses `PutItem` not `UpdateTable` — no modifications to existing tables
- S3 buckets use `halo-` prefix — no naming conflict possible
- IAM role is `halo-lambda-role` — separate from any existing roles
