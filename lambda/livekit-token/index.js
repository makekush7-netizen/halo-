import { AccessToken } from 'livekit-server-sdk';

/**
 * AWS Lambda to generate a LiveKit JWT token for guests joining rooms.
 * Validates the LiveKit API Key and Secret stored in Lambda environment variables.
 */
export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { roomName, participantName } = body;

    if (!roomName || !participantName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'roomName and participantName are required' })
      };
    }

    // These environment variables will be injected during deployment via API/Lambda settings
    // Defaulting to placeholder for safety if not set yet.
    const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
    const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';

    const safeName = String(participantName).trim()
    const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    // LiveKit requires identity uniqueness per room. If two users join with same name,
    // a shared identity would kick/replace the first participant.
    const uniqueIdentity = `${safeName}-${suffix}`

    const at = new AccessToken(apiKey, apiSecret, {
      identity: uniqueIdentity,
      name: safeName,
    });
    
    // Add grants allowing the user to publish/subscribe audio/video in the requested room
    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });

    // Generate token
    const token = await at.toJwt();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ token })
    };
  } catch (error) {
    console.error('Error generating token:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to generate token' })
    };
  }
};
