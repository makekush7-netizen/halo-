const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const {
      roomName,
      hostDetails,
      orgId,
      visibility,
      ownerUserId,
      ownerName,
      ownerRole,
      assignedTeacherUserId,
      assignedTeacherName,
      startsAt,
      endsAt,
      timezone,
      meetingType,
      status,
    } = body;
    
    if (!roomName) throw new Error('roomName is required');

    // Generate random 6 character code
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const command = new PutCommand({
      TableName: 'halo-rooms',
      Item: {
        roomId,
        name: roomName,
        host: hostDetails?.name || 'Admin',
        hostId: hostDetails?.id || 'unknown',
        ownerUserId: ownerUserId || hostDetails?.id || 'unknown',
        ownerName: ownerName || hostDetails?.name || 'Admin',
        ownerRole: ownerRole || 'member',
        assignedTeacherUserId: assignedTeacherUserId || null,
        assignedTeacherName: assignedTeacherName || null,
        orgId: orgId || 'personal',
        visibility: visibility || 'org',
        startsAt: startsAt || new Date().toISOString(),
        endsAt: endsAt || null,
        timezone: timezone || 'UTC',
        meetingType: meetingType || 'instant',
        participants: 0,
        attention: 100,
        createdAt: new Date().toISOString(),
        status: status || 'ACTIVE'
      }
    });

    await docClient.send(command);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
      },
      body: JSON.stringify({ roomId, name: roomName, host: hostDetails?.name })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
