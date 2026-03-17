// mosaic-attention-score
// Lambda function: attention monitoring per session
// Triggered every 30s by frontend polling or EventBridge

const { DynamoDBClient, UpdateItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb')
const dynamo = new DynamoDBClient({ region: 'ap-south-1' })

const TABLE = 'halo-sessions'

// Attention scoring formula (no LLM — pure logic)
function scoreParticipant({ cameraOn, micActive, tabVisible, mouseMoved }) {
  let score = 0
  if (cameraOn)   score += 30
  if (micActive)  score += 25
  if (tabVisible) score += 30
  if (mouseMoved) score += 15
  return Math.min(100, score)
}

exports.handler = async (event) => {
  try {
    const { sessionId, participants } = JSON.parse(event.body || '{}')

    if (!sessionId || !Array.isArray(participants)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'sessionId and participants required' }) }
    }

    const scored = participants.map(p => ({
      participantId: p.id,
      name: p.name,
      score: scoreParticipant({
        cameraOn: p.cameraOn,
        micActive: p.micActive,
        tabVisible: p.tabVisible,
        mouseMoved: p.mouseMoved,
      })
    }))

    const sessionScore = Math.round(scored.reduce((a, p) => a + p.score, 0) / scored.length)

    // Store in DynamoDB
    await dynamo.send(new UpdateItemCommand({
      TableName: TABLE,
      Key: { sessionId: { S: sessionId } },
      UpdateExpression: 'SET attentionScore = :score, participantScores = :ps, lastUpdated = :ts',
      ExpressionAttributeValues: {
        ':score': { N: String(sessionScore) },
        ':ps': { S: JSON.stringify(scored) },
        ':ts': { S: new Date().toISOString() },
      }
    }))

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ sessionScore, participants: scored })
    }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
