import { Handler } from '@netlify/functions';
import { Buffer } from 'buffer';

const FIREBASE_URL = 'https://fgddf-a6f13-default-rtdb.firebaseio.com/';
const MAX_INITIAL_CREDITS = 1_000_000;

interface AgentPayload {
  username?: string;
  name?: string;
  password?: string;
  credits?: number | string;
}

const jsonResponse = (statusCode: number, data: Record<string, unknown>) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify(data),
});

const ADMIN_USERNAME = 'admin';

const fetchAdminPassword = async (): Promise<string> => {
  try {
    const response = await fetch(`${FIREBASE_URL}admin_credentials.json`);
    if (response.ok) {
      const data: { password?: string } | null = await response.json();
      if (data && typeof data.password === 'string' && data.password.trim().length > 0) {
        return data.password;
      }
    }
  } catch (error) {
    console.error('Failed to fetch admin password', error);
  }

  return 'admin';
};

const unauthorizedResponse = () =>
  jsonResponse(401, {
    ok: false,
    error: 'UNAUTHORIZED',
    message: 'ต้องเข้าสู่ระบบผู้ดูแลระบบก่อน',
  });

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const authHeader = event.headers?.authorization || event.headers?.Authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return unauthorizedResponse();
  }

  let decoded = '';
  try {
    decoded = Buffer.from(authHeader.replace(/^Basic\s+/i, ''), 'base64').toString('utf-8');
  } catch {
    return unauthorizedResponse();
  }

  const [authUsername, ...passwordParts] = decoded.split(':');
  const authPassword = passwordParts.join(':');

  if (!authUsername || authUsername !== ADMIN_USERNAME || !authPassword) {
    return unauthorizedResponse();
  }

  const adminPassword = await fetchAdminPassword();
  if (authPassword !== adminPassword) {
    return unauthorizedResponse();
  }

  let payload: AgentPayload = {};
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { ok: false, error: 'INVALID_JSON' });
  }

  const username =
    typeof payload.username === 'string' && payload.username.trim().length > 0
      ? payload.username.trim()
      : typeof payload.name === 'string' && payload.name.trim().length > 0
      ? payload.name.trim()
      : '';
  const password = typeof payload.password === 'string' ? payload.password : '';

  let creditsValue: number = Number.NaN;
  if (typeof payload.credits === 'number') {
    creditsValue = payload.credits;
  } else if (typeof payload.credits === 'string') {
    creditsValue = Number(payload.credits);
  }

  if (!username) {
    return jsonResponse(422, { ok: false, error: 'USERNAME_REQUIRED', message: 'กรุณาระบุชื่อผู้ใช้' });
  }

  if (!password) {
    return jsonResponse(422, { ok: false, error: 'PASSWORD_REQUIRED', message: 'กรุณากำหนดรหัสผ่าน' });
  }

  if (!Number.isFinite(creditsValue)) {
    return jsonResponse(422, { ok: false, error: 'CREDITS_REQUIRED', message: 'กรุณาระบุจำนวนเครดิต' });
  }

  if (creditsValue <= 0) {
    return jsonResponse(422, { ok: false, error: 'INVALID_CREDITS', message: 'เครดิตต้องมากกว่า 0' });
  }

  if (!Number.isInteger(creditsValue)) {
    return jsonResponse(422, { ok: false, error: 'INVALID_CREDITS', message: 'เครดิตต้องเป็นจำนวนเต็ม' });
  }

  if (creditsValue > MAX_INITIAL_CREDITS) {
    return jsonResponse(422, {
      ok: false,
      error: 'CREDITS_TOO_HIGH',
      message: `เครดิตเริ่มต้นได้ไม่เกิน ${MAX_INITIAL_CREDITS.toLocaleString('th-TH')}`,
    });
  }

  const existingRes = await fetch(`${FIREBASE_URL}agents.json`);
  if (!existingRes.ok) {
    return jsonResponse(500, { ok: false, error: 'FETCH_AGENTS_FAILED' });
  }

  const existingData: Record<string, { username?: string }> | null = await existingRes.json();
  if (existingData) {
    const isDuplicate = Object.values(existingData).some(
      (agent) => agent.username?.toLowerCase() === username.toLowerCase()
    );
    if (isDuplicate) {
      return jsonResponse(409, { ok: false, error: 'USERNAME_TAKEN', message: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' });
    }
  }

  const now = new Date().toISOString();
  const agentId = `agent_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const initialHistory = {
    date: now,
    action: 'เครดิตเริ่มต้น (API)',
    amount: creditsValue,
    balanceAfter: creditsValue,
  };

  const agentRecord: Record<string, unknown> = {
    username,
    password,
    credits: creditsValue,
    createdAt: now,
    keys: {},
    creditHistory: [initialHistory],
    status: 'active',
    welcomeAcknowledged: false,
  };

  const saveRes = await fetch(`${FIREBASE_URL}agents/${agentId}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(agentRecord),
  });

  if (!saveRes.ok) {
    return jsonResponse(500, { ok: false, error: 'SAVE_FAILED' });
  }

  return jsonResponse(201, {
    ok: true,
    agent: {
      id: agentId,
      username,
      credits: creditsValue,
      createdAt: now,
    },
  });
};

export { handler };
