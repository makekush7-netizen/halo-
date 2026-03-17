const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const qp = event.queryStringParameters || {}
    const role = String(qp.role || 'member').toLowerCase()
    const userId = String(qp.userId || '').toLowerCase()
    const orgId = String(qp.orgId || '').toLowerCase()
    const includeAll = String(qp.includeAll || 'false').toLowerCase() === 'true'

    const command = new ScanCommand({
      TableName: 'halo-rooms',
    });

    const response = await docClient.send(command);
    const activeOrScheduled = (response.Items || []).filter((room) => ['ACTIVE', 'SCHEDULED'].includes(room.status))

    const byOrg = activeOrScheduled.filter((room) => {
      if (!orgId) return true
      return String(room.orgId || '').toLowerCase() === orgId
    })

    const filtered = byOrg.filter((room) => {
      const roomHostId = String(room.hostId || '').toLowerCase()
      const roomOwnerUserId = String(room.ownerUserId || '').toLowerCase()
      const roomAssignedTeacherId = String(room.assignedTeacherUserId || '').toLowerCase()

      if (role === 'admin' || role === 'co-admin') {
        if (includeAll) return true
        return roomHostId === userId || roomOwnerUserId === userId
      }

      return roomOwnerUserId === userId || roomAssignedTeacherId === userId || roomHostId === userId
    })

    filtered.sort((a, b) => {
      const at = new Date(a.startsAt || a.createdAt || 0).getTime()
      const bt = new Date(b.startsAt || b.createdAt || 0).getTime()
      return bt - at
    })

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
      },
      body: JSON.stringify({ rooms: filtered })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
