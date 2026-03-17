# Create AWS IAM User for Halo Setup

To allow me (the AI) to automatically set up the Halo backend infrastructure (Lambda, API Gateway, DynamoDB, etc.) securely without touching your AWS root account or Vaaniseva project, please create a dedicated IAM user by following these exact clicks.

## Step-by-Step Instructions

1. Log into your [AWS Management Console](https://console.aws.amazon.com/).
2. In the top search bar, type **IAM** and click the first result (IAM - Manage access to AWS resources).
3. On the left sidebar, click **Users**.
4. Click the yellow **Create user** button on the top right.
5. **Set user details:**
   - User name: `halo-deployer`
   - *Do NOT check* the box for "Provide user access to the AWS Management Console" (this user is only for API access).
   - Click **Next**.
6. **Set permissions:**
   - Select the option **Attach policies directly**.
   - In the Permissions policies search box below, search for and check the box next to EACH of these exactly as written:
     - `AWSLambda_FullAccess`
     - `AmazonDynamoDBFullAccess`
     - `AmazonAPIGatewayAdministrator`
     - `AmazonS3FullAccess`
     - `AmazonBedrockFullAccess`
     - `AmazonTranscribeFullAccess`
     - `CloudWatchLogsFullAccess`
     - `IAMFullAccess` *(Required so I can create execution roles for the Lambda functions)*
   - Click **Next**.
7. **Review and create:**
   - Review that all 8 policies are listed.
   - Click **Create user**.

## Generate Access Keys

1. You should now be back on the Users list. Click on the new **halo-deployer** user you just created.
2. Click on the **Security credentials** tab.
3. Scroll down to the **Access keys** section and click **Create access key**.
4. Select **Command Line Interface (CLI)**, check the confirmation box at the bottom, and click **Next**.
5. Description tag (optional): Leave blank or type "Halo AI Setup", then click **Create access key**.
6. **IMPORTANT:** You will now see an `Access key` and a `Secret access key`. 
   - Copy BOTH of these values.
   - You *cannot* see the secret key again after you close this page.
7. Click **Done**.

### Next Steps

Provide the **Access key** and **Secret access key** to me in the chat. I will configure the AWS CLI locally and use them to deploy the Halo backend architecture safely in isolation!
