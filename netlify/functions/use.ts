import { Handler } from '@netlify/functions';

const FIREBASE_URL = 'https://fgddf-a6f13-default-rtdb.firebaseio.com/';

interface ApiKey {
  key: string;
  tokens_remaining: number;
  status: 'active' | 'inactive';
}

interface AgentRecord {
  keys?: Record<string, ApiKey[]>;
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const segments = event.path.split('/').filter(Boolean);
  // path shape: /api/:platform/use
  const platformId = segments[segments.length - 2];

  let body: { key?: string; tokens?: number } = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'INVALID_JSON' }) };
  }

  const { key: keyParam, tokens } = body;
  const ip =
    event.headers['x-nf-client-connection-ip'] ||
    event.headers['x-forwarded-for'] ||
    'unknown';

  if (!platformId || !keyParam || typeof tokens !== 'number') {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'MISSING_PARAMS', message: 'platform, key and tokens are required' }),
    };
  }

  // verify platform is enabled
  const platformRes = await fetch(`${FIREBASE_URL}platforms/${platformId}.json`);
  if (platformRes.ok) {
    const platformData: { apiEnabled?: boolean } | null = await platformRes.json();
    if (platformData && platformData.apiEnabled === false) {
      return {
        statusCode: 403,
        body: JSON.stringify({ ok: false, error: 'PLATFORM_DISABLED', message: 'This platform is disabled.' }),
      };
    }
  }

  let foundKey: ApiKey | null = null;
  let updatePath: string | null = null;
  let foundAgentId: string | null = null;

  // check platform-specific key store
  const platformKeyRes = await fetch(
    `${FIREBASE_URL}${platformId}_keys/${encodeURIComponent(keyParam)}.json`
  );
  if (platformKeyRes.ok) {
    const data: Omit<ApiKey, 'key'> | null = await platformKeyRes.json();
    if (data) {
      foundKey = { key: keyParam, ...data };
      updatePath = `${platformId}_keys/${encodeURIComponent(keyParam)}`;
    }
  }

  // search key within agent-owned keys for this platform only
  if (!foundKey) {
    const agentsRes = await fetch(`${FIREBASE_URL}agents.json`);
    if (agentsRes.ok) {
      const agentsData: Record<string, AgentRecord> | null = await agentsRes.json();
      if (agentsData) {
        outer: for (const [agentId, agent] of Object.entries(agentsData)) {
          const keys = agent.keys?.[platformId] || [];
          for (let i = 0; i < keys.length; i++) {
            if (keys[i].key === keyParam) {
              foundKey = keys[i];
              updatePath = `agents/${agentId}/keys/${platformId}/${i}`;
              foundAgentId = agentId;
              break outer;
            }
          }
        }
      }
    }
  }

  // search standalone keys that belong to this platform
  if (!foundKey) {
    const standaloneRes = await fetch(`${FIREBASE_URL}standalone_keys.json`);
    if (standaloneRes.ok) {
      const standaloneData: Record<string, ApiKey & { platformId?: string }> | null = await standaloneRes.json();
      if (standaloneData) {
        for (const [id, key] of Object.entries(standaloneData)) {
          if (key.key === keyParam && key.platformId === platformId) {
            foundKey = key;
            updatePath = `standalone_keys/${id}`;
            foundAgentId = 'standalone';
            break;
          }
        }
      }
    }
  }

  if (!foundKey || !updatePath) {
    return {
      statusCode: 404,
      body: JSON.stringify({ ok: false, error: 'KEY_NOT_FOUND', message: 'The provided key does not exist.' }),
    };
  }

  if (foundAgentId) {
    const banRes = await fetch(`${FIREBASE_URL}ip_bans/${foundAgentId}.json`);
    if (banRes.ok) {
      const banData: Record<string, { ip: string }> | null = await banRes.json();
      if (banData && Object.values(banData).some((b) => b.ip === ip)) {
        return {
          statusCode: 403,
          body: JSON.stringify({ ok: false, error: 'IP_BANNED', message: 'This IP is banned.' }),
        };
      }
    }
  }

  if (foundKey.status !== 'active') {
    return {
      statusCode: 403,
      body: JSON.stringify({ ok: false, error: 'KEY_SUSPENDED', message: 'This key has been suspended.' }),
    };
  }

  if (foundKey.tokens_remaining < tokens) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'INSUFFICIENT_TOKENS', message: 'Not enough tokens remaining.' }),
    };
  }

  const newRemaining = foundKey.tokens_remaining - tokens;

  await fetch(`${FIREBASE_URL}${updatePath}.json`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokens_remaining: newRemaining }),
  });

  // deduct credits and record credit history for agent-owned keys
  if (foundAgentId && foundAgentId !== 'standalone') {
    const agentRes = await fetch(`${FIREBASE_URL}agents/${foundAgentId}.json`);
    if (agentRes.ok) {
      const agentData: { credits?: number; creditHistory?: any[] } | null = await agentRes.json();
      if (agentData) {
        const newCredits = (agentData.credits || 0) - tokens;
        const history = agentData.creditHistory || [];
        history.push({
          date: new Date().toISOString(),
          action: 'use',
          amount: -tokens,
          balanceAfter: newCredits,
        });
        await fetch(`${FIREBASE_URL}agents/${foundAgentId}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credits: newCredits, creditHistory: history }),
        });
      }
    }
  }

  await fetch(`${FIREBASE_URL}key_logs.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: keyParam, agentId: foundAgentId, ip, usedAt: new Date().toISOString(), tokensUsed: tokens }),
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, tokens_remaining: newRemaining }),
  };
};

export { handler };

