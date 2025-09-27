const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@$%*?#';

export const ADMIN_PASSWORD_TTL_MS = 60 * 60 * 1000; // 1 hour

type MaybeCrypto = { getRandomValues?: (array: Uint8Array) => Uint8Array };

const getRandomInt = (max: number) => {
    if (max <= 0) {
        return 0;
    }

    const globalCrypto = (globalThis as { crypto?: MaybeCrypto }).crypto;
    if (globalCrypto?.getRandomValues) {
        const array = new Uint32Array(1);
        globalCrypto.getRandomValues(array);
        return array[0] % max;
    }

    return Math.floor(Math.random() * max);
};

export const generateAdminPassword = (length = 16): string => {
    const chars = CHARSET;
    let password = '';
    for (let i = 0; i < length; i += 1) {
        const index = getRandomInt(chars.length);
        password += chars.charAt(index);
    }
    return password;
};

export const isAdminPasswordExpired = (rotatedAt?: string, ttlMs = ADMIN_PASSWORD_TTL_MS): boolean => {
    if (!rotatedAt) {
        return true;
    }
    const rotatedTime = new Date(rotatedAt).getTime();
    if (Number.isNaN(rotatedTime)) {
        return true;
    }
    return rotatedTime + ttlMs <= Date.now();
};

export interface AdminCredentialsRecord {
    password: string;
    rotatedAt: string;
}

export const buildAdminCredentialsRecord = (
    password: string,
    rotatedAt = new Date().toISOString(),
): AdminCredentialsRecord => ({
    password,
    rotatedAt,
});
