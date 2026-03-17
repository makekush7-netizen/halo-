const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const REGION = 'us-east-1';
const PROFILE = 'halo-deployer';

// Ensure we use the profile we just set up
process.env.AWS_PROFILE = PROFILE;

const dbClient = new DynamoDBClient({ region: REGION });

async function createTable() {
  console.log('🔄 Creating DynamoDB Table: halo-rooms...');
  try {
    const command = new CreateTableCommand({
      TableName: 'halo-rooms',
      AttributeDefinitions: [
        { AttributeName: 'roomId', AttributeType: 'S' }
      ],
      KeySchema: [
        { AttributeName: 'roomId', KeyType: 'HASH' }
      ],
      BillingMode: 'PAY_PER_REQUEST',
    });

    const response = await dbClient.send(command);
    console.log('✅ DynamoDB Table Created Successfully!');
    console.log(response.TableDescription.TableArn);
  } catch (err) {
    if (err.name === 'ResourceInUseException') {
      console.log('⚡ Table "halo-rooms" already exists. Skipping creation.');
    } else {
      console.error('❌ Error creating table:', err.message);
    }
  }
}

async function runAll() {
  console.log('🚀 Starting Halo Backend Deployment...');
  await createTable();
  console.log('✨ Database provisioning complete. Next: Lambda functions! (Script coming soon)');
}

runAll();
