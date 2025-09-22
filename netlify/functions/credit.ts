import { Handler } from '@netlify/functions';

const FIREBASE_URL = 'https://fgddf-a6f13-default-rtdb.firebaseio.com/';

interface ApiKey {
  key: string;
  tokens_remaining: number;
  status: 'active' | 'inactive';
  usageMode?: 'token' | 'duration';
  expiresAt?: string;
  durationDays?: number;
}

interface AgentRecord {
  keys?: Record<string, ApiKey[]>;
}

const handler: Handler = async (event) => {
  const segments = event.path.split('/').filter(Boolean);
  // path shape: /api/:platform/credit
  const platformId = segments[segments.length - 2];
  const keyParam = event.queryStringParameters?.key;
  const ip =
    event.headers['x-nf-client-connection-ip'] ||
    event.headers['x-forwarded-for'] ||
    'unknown';

  if (!platformId || !keyParam) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'MISSING_PARAMS', message: 'platform and key are required' }),
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

  let foundAgentId: string | null = null;
  let foundKey: ApiKey | null = null;

  // first, check platform-specific key store (e.g., qkp_keys)
  const platformKeyRes = await fetch(
    `${FIREBASE_URL}${platformId}_keys/${encodeURIComponent(keyParam)}.json`
  );
  if (platformKeyRes.ok) {
    const data: Omit<ApiKey, 'key'> | null = await platformKeyRes.json();
    if (data) {
      foundKey = { key: keyParam, ...data };
    }
  }

  // search key within agent-owned keys for this platform only
  if (!foundKey) {
    const agentsRes = await fetch(`${FIREBASE_URL}agents.json`);
    if (!agentsRes.ok) {
      return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'FETCH_AGENTS_FAILED' }) };
    }
    const agentsData: Record<string, AgentRecord> | null = await agentsRes.json();
    if (agentsData) {
      outer: for (const [agentId, agent] of Object.entries(agentsData)) {
        const keys = agent.keys?.[platformId] || [];
        const match = keys.find((k) => k.key === keyParam);
        if (match) {
          foundAgentId = agentId;
          foundKey = match;
          break outer;
        }
      }
    }
  }

  // if not found under agents, search standalone keys for this platform
  if (!foundKey) {
    const standaloneRes = await fetch(`${FIREBASE_URL}standalone_keys.json`);
    if (!standaloneRes.ok) {
      return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'FETCH_KEYS_FAILED' }) };
    }
    const standaloneData: Record<string, ApiKey & { platformId?: string }> | null = await standaloneRes.json();
    if (standaloneData) {
      for (const key of Object.values(standaloneData)) {
        if (key.key === keyParam && key.platformId === platformId) {
          foundKey = key;
          foundAgentId = 'standalone';
          break;
        }
      }
    }
  }

  if (!foundKey) {
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

  const usageMode: 'token' | 'duration' = foundKey.usageMode === 'duration' ? 'duration' : 'token';

  let expiresAtIso: string | undefined;
  let daysRemaining: number | undefined;

  if (usageMode === 'duration' && foundKey.expiresAt) {
    const expiresAt = new Date(foundKey.expiresAt);
    if (!Number.isNaN(expiresAt.getTime())) {
      expiresAtIso = expiresAt.toISOString();
      const diffMs = expiresAt.getTime() - Date.now();
      daysRemaining = diffMs <= 0 ? 0 : Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }
  }

  await fetch(`${FIREBASE_URL}key_logs.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: keyParam, agentId: foundAgentId, ip, usedAt: new Date().toISOString(), usageMode }),
  });

  let status: string = foundKey.status;
  if (usageMode === 'token') {
    status = foundKey.tokens_remaining <= 0 ? 'no_tokens' : foundKey.status;
  } else if (typeof daysRemaining === 'number' && daysRemaining <= 0) {
    status = 'expired';
  }

  const responseBody: Record<string, unknown> = {
    ok: true,
    usageMode,
    tokens_remaining: foundKey.tokens_remaining,
    status,
  };

  if (usageMode === 'duration') {
    if (typeof foundKey.durationDays === 'number' && Number.isFinite(foundKey.durationDays)) {
      responseBody.durationDays = foundKey.durationDays;
    }
    if (expiresAtIso) {
      responseBody.expiresAt = expiresAtIso;
    }
    if (typeof daysRemaining === 'number') {
      responseBody.days_remaining = daysRemaining;
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify(responseBody),
  };
};

export { handler };
