const { ApiGatewayV2Client, CreateApiCommand, CreateIntegrationCommand, CreateRouteCommand, CreateStageCommand } = require('@aws-sdk/client-apigatewayv2');
const { LambdaClient, AddPermissionCommand } = require('@aws-sdk/client-lambda');
const fs = require('fs');
const path = require('path');

const REGION = 'us-east-1';
process.env.AWS_PROFILE = 'halo-deployer';

const apiGatewayClient = new ApiGatewayV2Client({ region: REGION });
const lambdaClient = new LambdaClient({ region: REGION });
const ACCOUNT_ID = '809567033505';

async function deployApi() {
  console.log('🔄 Creating HTTP API...');
  
  // 1. Create API
  const apiRes = await apiGatewayClient.send(new CreateApiCommand({
    Name: 'HaloAPI',
    ProtocolType: 'HTTP',
    CorsConfiguration: {
      AllowOrigins: ['*'],
      AllowMethods: ['GET', 'POST', 'OPTIONS'],
      AllowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date']
    }
  }));
  const apiId = apiRes.ApiId;
  const apiUrl = apiRes.ApiEndpoint;
  console.log(`✅ API Created: ${apiId} (${apiUrl})`);

  // Helper to connect a Route to a Lambda
  async function connectRoute(routeKey, funcName) {
    const lambdaArn = `arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${funcName}`;
    
    // Add permission for API Gateway to invoke this Lambda
    try {
      await lambdaClient.send(new AddPermissionCommand({
        FunctionName: funcName,
        StatementId: `apigw-invoke-${apiId}-${funcName}`,
        Action: 'lambda:InvokeFunction',
        Principal: 'apigateway.amazonaws.com',
        SourceArn: `arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${apiId}/*/*`
      }));
      console.log(`   🔑 Added APIGW permission to Lambda ${funcName}`);
    } catch (e) {
      if (e.name !== 'ResourceConflictException') console.error('Warning adding permission:', e.message);
    }

    // Create APIGW Integration
    console.log(`   🔗 Integrating ${funcName}...`);
    const intRes = await apiGatewayClient.send(new CreateIntegrationCommand({
      ApiId: apiId,
      IntegrationType: 'AWS_PROXY',
      IntegrationUri: lambdaArn,
      PayloadFormatVersion: '2.0'
    }));

    // Create Route
    console.log(`   🛣️ Creating Route ${routeKey}...`);
    await apiGatewayClient.send(new CreateRouteCommand({
      ApiId: apiId,
      RouteKey: routeKey,
      Target: `integrations/${intRes.IntegrationId}`
    }));
  }

  // 2. Connect Routes
  await connectRoute('POST /rooms', 'create-room');
  await connectRoute('GET /rooms', 'list-rooms');
  await connectRoute('POST /livekit-token', 'livekit-token');

  // 3. Create Default Stage mapping
  console.log('🔄 Deploying API Stage...');
  await apiGatewayClient.send(new CreateStageCommand({
    ApiId: apiId,
    StageName: '$default',
    AutoDeploy: true
  }));

  console.log('\n🎉 API GATEWAY DEPLOYED SUCCESSFULLY!');
  console.log('🚀 YOUR ENDPOINT URL:');
  console.log(apiUrl);
  
  // Save to .env.local automatically
  const envPath = path.resolve(process.cwd(), '.env.local');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  if (envContent.includes('VITE_API_BASE_URL=')) {
    envContent = envContent.replace(/VITE_API_BASE_URL=.*/, `VITE_API_BASE_URL=${apiUrl}`);
  } else {
    envContent += `\nVITE_API_BASE_URL=${apiUrl}\n`;
  }
  fs.writeFileSync(envPath, envContent);
  console.log('\n✍️ Wrote VITE_API_BASE_URL to .env.local');
}

deployApi().catch(console.error);
