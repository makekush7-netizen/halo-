// mosaic-post-session-report
// Lambda function: generates full post-session AI report via Bedrock Nova Lite
// Called when host ends a session

const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime')
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3')
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb')

const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' })
const s3 = new S3Client({ region: 'ap-south-1' })
const dynamo = new DynamoDBClient({ region: 'ap-south-1' })

const TRANSCRIPT_BUCKET = process.env.TRANSCRIPT_BUCKET || 'halo-transcripts-kush'
const TABLE = 'halo-sessions'
const MODEL_ID = 'amazon.nova-lite-v1:0'

exports.handler = async (event) => {
  try {
    const { sessionId, sessionName, hostName, participantCount, durationMinutes, attentionAvg } = JSON.parse(event.body || '{}')

    if (!sessionId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'sessionId required' }) }
    }

    // Get all transcript chunks
    const listRes = await s3.send(new ListObjectsV2Command({
      Bucket: TRANSCRIPT_BUCKET,
      Prefix: `${sessionId}/`
    }))

    let fullTranscript = ''
    if (listRes.Contents && listRes.Contents.length > 0) {
      const sorted = listRes.Contents.sort((a, b) => a.Key.localeCompare(b.Key))
      const chunks = await Promise.all(
        sorted.map(async obj => {
          const res = await s3.send(new GetObjectCommand({ Bucket: TRANSCRIPT_BUCKET, Key: obj.Key }))
          return res.Body.transformToString()
        })
      )
      fullTranscript = chunks.join(' ')
    }

    const prompt = `You are generating a post-session report for an educational live session.
Session: "${sessionName}"
Host: ${hostName}
Participants: ${participantCount}
Duration: ${durationMinutes} minutes
Average attention score: ${attentionAvg}%

Transcript:
${fullTranscript.substring(0, 8000)}

Generate a structured JSON report with exactly these keys:
{
  "topics": ["list of 3–6 topics covered"],
  "participationSummary": "2–3 sentence summary of participation",
  "notableQuestions": ["2–4 notable questions asked"],
  "followUpActions": ["3–5 concrete follow-up recommendations"]
}
Return only valid JSON.`

    const response = await bedrock.send(new ConverseCommand({
      modelId: MODEL_ID,
      messages: [{ role: 'user', content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 800, temperature: 0.3 }
    }))

    const raw = response.output.message.content[0].text.trim()
    let report
    try {
      // Strip potential markdown code blocks
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim()
      report = JSON.parse(cleaned)
    } catch {
      report = { topics: [], participationSummary: raw, notableQuestions: [], followUpActions: [] }
    }

    // Store report in DynamoDB
    await dynamo.send(new PutItemCommand({
      TableName: TABLE,
      Item: {
        sessionId: { S: sessionId },
        sessionName: { S: sessionName || '' },
        hostName: { S: hostName || '' },
        report: { S: JSON.stringify(report) },
        attentionAvg: { N: String(attentionAvg || 0) },
        durationMinutes: { N: String(durationMinutes || 0) },
        participantCount: { N: String(participantCount || 0) },
        endedAt: { S: new Date().toISOString() },
        status: { S: 'ended' }
      }
    }))

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ sessionId, report })
    }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
