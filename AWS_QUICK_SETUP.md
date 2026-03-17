# AWS Backend Setup Guide (Manual & Fast)

Instead of complex CloudFormation or local AWS CLI requirements which can be painful when working with multiple GitHub student accounts, here is the fastest way to get your AWS Backend running. 

This will **not** interfere with your existing `vaaniseva` project.

## 1. Auth: Set up AWS Cognito (5 minutes)
Cognito handles your Admin Logins and issues the tokens needed for your APIs.

1. Go to the [AWS Cognito Console](https://console.aws.amazon.com/cognito)
2. Click **Create user pool**
3. **Step 1 (Sign-in experience):** Select **Email** and **User name**.
4. **Step 2 (Security):** Choose "Cognito defaults" (MFA optional, Password policy: Cognito default).
5. **Step 3 (Sign-up experience):** 
   - Keep default for self-registration.
   - Under *Required attributes*, add **name**.
6. **Step 4 (Message delivery):** Choose **Send email with Cognito** (easiest for dev, no SES needed).
7. **Step 5 (Integrate your app):**
   - User pool name: `HaloAdminPool`
   - Hosted UI: Check the box for **Use the Cognito Hosted UI**.
   - Domain: Create a Cognito domain (e.g., `halo-auth-yourname`).
   - App client name: `HaloFrontendApp`
   - Client secret: **Don't generate a client secret** (React can't use it).
   - Allowed callback URLs: `http://localhost:3000/` (add production domains later like `https://halo.tech/`).
   - Allowed sign-out URLs: `http://localhost:3000/`.
   - Advanced Auth settings > OAuth 2.0 grant types: Check **Authorization code grant**.
8. Click **Create**!

### Connect it to React
Check your Cognito User pool, grab these IDs, and put them in `Halo/.env.local`:
```env
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX     # Find in Pool general settings
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX # Find in App Integration > App Client
VITE_COGNITO_DOMAIN=halo-auth-yourname.auth.us-east-1.amazoncognito.com
VITE_COGNITO_REDIRECT_URI=http://localhost:3000/
```

---

## 2. Database: Set up DynamoDB (2 minutes)
1. Go to [AWS DynamoDB Console](https://console.aws.amazon.com/dynamodbv2)
2. Click **Create table**
3. Table name: `halo-rooms`
4. Partition key: `roomId` (String)
5. Leave everything else default and click **Create**.

---

## 3. APIs: Create the Lambda Functions (10 minutes)
1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda)
2. Create Function -> Author from scratch -> `Node.js 20.x`
3. Name it: `halo-create-room`
4. Under **Permissions**, attach the `AmazonDynamoDBFullAccess` policy so it can write to your DB.
5. In the Code Source tab, paste the code from `.agents/workflows/backend/create-room.js` (I will write this file for you momentarily) and hit **Deploy**.

*(Repeat for `halo-list-rooms` and `halo-livekit-token`)*

---

## 4. API Gateway: Connect Frontend to Lambda
1. Go to [AWS API Gateway](https://console.aws.amazon.com/apigateway)
2. Build a **HTTP API** (cheaper, faster than REST).
3. Name: `HaloAPI`
4. Add 3 Routes:
   - `POST /rooms` -> Integration: `halo-create-room`
   - `GET /rooms` -> Integration: `halo-list-rooms`
   - `POST /token` -> Integration: `halo-livekit-token`
5. Go to **CORS** settings for your API Gateway and add `*` or `http://localhost:3000` to Allowed Origins so React can talk to it without error.
6. Copy the **Invoke URL** and put it in your `.env.local`:
```env
VITE_API_BASE_URL=https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com
```

You are now fully connected to AWS!
