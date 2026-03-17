// mosaic-late-joiner-summary
// Lambda function: generates late-joiner AI summary via Bedrock Nova Lite
// Called when participant joins a session that's been running > 5 minutes

const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime')
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3')

const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' }) // Bedrock Nova Lite in us-east-1
const s3 = new S3Client({ region: 'ap-south-1' })

const TRANSCRIPT_BUCKET = process.env.TRANSCRIPT_BUCKET || 'halo-transcripts-kush'
const MODEL_ID = 'amazon.nova-lite-v1:0'

async function getTranscriptChunks(sessionId) {
  const listRes = await s3.send(new ListObjectsV2Command({
    Bucket: TRANSCRIPT_BUCKET,
    Prefix: `${sessionId}/`,
    MaxKeys: 50 // last 50 chunks
  }))

  if (!listRes.Contents || listRes.Contents.length === 0) return ''

  // Sort chronologically by key
  const sorted = listRes.Contents.sort((a, b) => a.Key.localeCompare(b.Key))

  const chunks = await Promise.all(
    sorted.map(async obj => {
      const res = await s3.send(new GetObjectCommand({ Bucket: TRANSCRIPT_BUCKET, Key: obj.Key }))
      return res.Body.transformToString()
    })
  )

  return chunks.join(' ')
}

exports.handler = async (event) => {
  try {
    const { sessionId, sessionName } = JSON.parse(event.body || '{}')

    if (!sessionId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'sessionId required' }) }
    }

    const transcript = await getTranscriptChunks(sessionId)

    if (!transcript || transcript.length < 50) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ summary: ['Session just started — not much to summarize yet.'] })
      }
    }

    const prompt = `You are summarizing a live educational session for a student who just joined late.
Session name: "${sessionName}"
Transcript so far:
${transcript.substring(0, 6000)}

Generate exactly 3–5 bullet points summarizing what has been discussed so far. Be concise, specific, and educational.
Return as a JSON array of strings (no markdown, no extra text).
Example: ["Point 1", "Point 2", "Point 3"]`

    const response = await bedrock.send(new ConverseCommand({
      modelId: MODEL_ID,
      messages: [{ role: 'user', content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 400, temperature: 0.3 }
    }))

    const raw = response.output.message.content[0].text.trim()
    let summary
    try {
      summary = JSON.parse(raw)
    } catch {
      summary = raw.split('\n').filter(l => l.trim().startsWith('"') || l.trim().startsWith('-')).map(l => l.replace(/^[-"•·]/, '').replace(/",$/, '').trim())
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ summary })
    }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
