import { Handler } from '@netlify/functions';
import { ADMIN_PASSWORD_TTL_MS, AdminCredentialsRecord, buildAdminCredentialsRecord, generateAdminPassword, isAdminPasswordExpired } from '../../utils/password';

const FIREBASE_URL = 'https://fgddf-a6f13-default-rtdb.firebaseio.com/';

const jsonResponse = (statusCode: number, data: Record<string, unknown>) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify(data),
});

const loadAdminPasswordRecord = async (): Promise<AdminCredentialsRecord | null> => {
  try {
    const response = await fetch(`${FIREBASE_URL}admin_credentials.json`);
    if (response.ok) {
      const data: Partial<AdminCredentialsRecord> | null = await response.json();
      if (data && typeof data.password === 'string' && data.password.trim().length > 0) {
        return {
          password: data.password,
          rotatedAt: typeof data.rotatedAt === 'string' ? data.rotatedAt : '',
        };
      }
    }
  } catch (error) {
    console.error('Failed to load admin password record:', error);
  }
  return null;
};

const saveAdminPasswordRecord = async (record: AdminCredentialsRecord): Promise<void> => {
  const response = await fetch(`${FIREBASE_URL}admin_credentials.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!response.ok) {
    throw new Error(`Failed to persist admin password: ${response.statusText}`);
  }
};

const ensureAdminPasswordRecord = async (): Promise<AdminCredentialsRecord> => {
  const existingRecord = await loadAdminPasswordRecord();
  if (!existingRecord || !existingRecord.password || isAdminPasswordExpired(existingRecord.rotatedAt)) {
    const freshRecord = buildAdminCredentialsRecord(generateAdminPassword());
    await saveAdminPasswordRecord(freshRecord);
    return freshRecord;
  }

  if (existingRecord.rotatedAt) {
    return existingRecord;
  }

  const refreshedRecord = buildAdminCredentialsRecord(existingRecord.password);
  await saveAdminPasswordRecord(refreshedRecord);
  return refreshedRecord;
};

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const record = await ensureAdminPasswordRecord();
    const rotatedAt = record.rotatedAt;
    const expiresAt = new Date(new Date(rotatedAt).getTime() + ADMIN_PASSWORD_TTL_MS).toISOString();
    return jsonResponse(200, {
      ok: true,
      password: record.password,
      rotatedAt,
      expiresAt,
    });
  } catch (error) {
    console.error('Failed to process admin password rotation:', error);
    return jsonResponse(500, {
      ok: false,
      error: 'ADMIN_PASSWORD_ROTATION_FAILED',
      message: 'ไม่สามารถสร้างรหัสผ่านใหม่ได้ โปรดลองอีกครั้ง',
    });
  }
};

export { handler };
