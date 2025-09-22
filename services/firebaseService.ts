
import { Platform, Agent, Bot, ApiKey, StandaloneKey, KeyLog, IpBan, MaintenanceConfig, Application, UsageMode } from '../types';

// IMPORTANT: In a real application, these values should come from environment variables.
// For this example, we are using the URL provided in the prompt.
const FIREBASE_URL = 'https://fgddf-a6f13-default-rtdb.firebaseio.com/';

async function fetchData<T,>(path: string): Promise<T> {
  const response = await fetch(`${FIREBASE_URL}${path}.json`);
  if (!response.ok) {
    throw new Error(`Firebase fetch error: ${response.statusText}`);
  }
  return response.json();
}

async function setData<T,>(path: string, data: T): Promise<void> {
  const response = await fetch(`${FIREBASE_URL}${path}.json`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Firebase set data error: ${response.statusText}`);
  }
}

async function deleteData(path: string): Promise<void> {
    const response = await fetch(`${FIREBASE_URL}${path}.json`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error(`Firebase delete data error: ${response.statusText}`);
    }
}

type AdminPasswordSource = 'remote' | 'local' | 'default';

const getCachedAdminPassword = (): string | null => {
    if (typeof window === 'undefined') {
        return null;
    }
    return localStorage.getItem('adminPassword');
};

const cacheAdminPassword = (password: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('adminPassword', password);
    }
};

export const getAdminPassword = async (): Promise<{ password: string; source: AdminPasswordSource }> => {
    try {
        const data = await fetchData<{ password?: string } | null>('admin_credentials');
        if (data && typeof data.password === 'string' && data.password.trim().length > 0) {
            cacheAdminPassword(data.password);
            return { password: data.password, source: 'remote' };
        }
    } catch (error) {
        console.error('Failed to fetch admin password:', error);
    }

    const cached = getCachedAdminPassword();
    if (cached) {
        return { password: cached, source: 'local' };
    }

    return { password: 'admin', source: 'default' };
};

export const setAdminPassword = async (password: string): Promise<void> => {
    await setData('admin_credentials', { password });
    cacheAdminPassword(password);
};


// Helper to convert Firebase object response to array
const firebaseObjectToArray = <T extends {id: string}>(data: Record<string, Omit<T, 'id'>> | null): T[] => {
    if (!data) return [];
    return Object.entries(data).map(([id, value]) => ({ id, ...value } as T));
}

const buildChildMap = (agents: Agent[]): Map<string, Agent[]> => {
    const map = new Map<string, Agent[]>();
    agents.forEach((agent) => {
        if (!agent.parentId) {
            return;
        }
        const children = map.get(agent.parentId) || [];
        children.push(agent);
        map.set(agent.parentId, children);
    });
    return map;
};

const collectAgentTree = (agents: Agent[], rootId: string): Agent[] => {
    const agentMap = new Map(agents.map((agent) => [agent.id, agent]));
    const childMap = buildChildMap(agents);
    const stack = [rootId];
    const visited = new Set<string>();
    const result: Agent[] = [];

    while (stack.length > 0) {
        const currentId = stack.pop();
        if (!currentId || visited.has(currentId)) {
            continue;
        }
        const currentAgent = agentMap.get(currentId);
        if (!currentAgent) {
            continue;
        }
        visited.add(currentId);
        result.push(currentAgent);
        const children = childMap.get(currentId) || [];
        children.forEach((child) => {
            stack.push(child.id);
        });
    }

    return result;
};

const toggleAgentBanState = (agent: Agent, banned: boolean, rootId: string): Agent => {
    const updatedAgent: Agent = {
        ...agent,
        status: banned ? 'banned' : 'active',
    };
    const isRoot = agent.id === rootId;
    const originalBanLocked = agent.banLocked;

    if (banned) {
        if (isRoot || agent.status !== 'banned' || originalBanLocked) {
            updatedAgent.banLocked = true;
        } else {
            delete (updatedAgent as Partial<Agent>).banLocked;
        }
    } else if (isRoot || originalBanLocked) {
        delete (updatedAgent as Partial<Agent>).banLocked;
    }

    if (!agent.keys) {
        return updatedAgent;
    }

    let keysChanged = false;
    const updatedKeys: NonNullable<Agent['keys']> = {};

    Object.entries(agent.keys).forEach(([platformId, keyList]) => {
        const newList = keyList.map((key) => {
            if (banned) {
                if (key.status === 'active' || key.banLocked) {
                    keysChanged = true;
                    return { ...key, status: 'inactive', banLocked: true };
                }
                return key;
            }

            if (key.banLocked) {
                const { banLocked, ...rest } = key;
                keysChanged = true;
                return { ...rest, status: 'active' };
            }

            return key;
        });

        updatedKeys[platformId] = keysChanged ? newList : keyList;
    });

    if (keysChanged) {
        updatedAgent.keys = updatedKeys;
    } else {
        updatedAgent.keys = agent.keys;
    }

    return updatedAgent;
};

export const getPlatforms = async (): Promise<Platform[]> => {
    const data = await fetchData<Record<string, Omit<Platform, 'id'>>>('platforms');
    return firebaseObjectToArray(data);
};

export const addPlatform = async (platform: Omit<Platform, 'id'> & {id: string}): Promise<void> => {
    const { id, ...platformData } = platform;
    await setData(`platforms/${id}`, platformData);
};

export const updatePlatform = async(platform: Platform): Promise<void> => {
    const { id, ...platformData } = platform;
    await setData(`platforms/${id}`, platformData);
}

export const deletePlatform = async(platformId: string): Promise<void> => {
    await deleteData(`platforms/${platformId}`);
}

export const getAgents = async (): Promise<Agent[]> => {
    const data = await fetchData<Record<string, Omit<Agent, 'id'>>>('agents');
    return firebaseObjectToArray(data);
};

export const addAgent = async (agent: Omit<Agent, 'id'> & {id: string}): Promise<void> => {
    const { id, ...agentData } = agent;
    await setData(`agents/${id}`, agentData);
};

export const updateAgent = async(agent: Agent): Promise<void> => {
    const { id, ...agentData } = agent;
    await setData(`agents/${id}`, agentData);
}

export const setAgentBanState = async(agentId: string, banned: boolean): Promise<void> => {
    const agents = await getAgents();
    const affectedAgents = collectAgentTree(agents, agentId);

    if (affectedAgents.length === 0) {
        throw new Error('Agent not found');
    }

    const targets = banned
        ? affectedAgents
        : affectedAgents.filter((agent) => agent.id === agentId || agent.banLocked);

    if (targets.length === 0) {
        return;
    }

    await Promise.all(
        targets.map((agent) => {
            const updated = toggleAgentBanState(agent, banned, agentId);
            return updateAgent(updated);
        }),
    );
}

export const deleteAgent = async(agentId: string): Promise<void> => {
    const agents = await getAgents();
    const affectedAgents = collectAgentTree(agents, agentId);

    if (affectedAgents.length === 0) {
        return;
    }

    const idsToDelete = new Set(affectedAgents.map((agent) => agent.id));
    let logs: KeyLog[] = [];

    try {
        logs = await getKeyLogs();
    } catch (error) {
        console.error('Failed to fetch key logs during agent deletion:', error);
    }

    const logDeletions = logs
        .filter((log) => idsToDelete.has(log.agentId))
        .map((log) => deleteData(`key_logs/${log.id}`).catch(() => undefined));

    const ipBanDeletions = Array.from(idsToDelete).map((id) =>
        deleteData(`ip_bans/${id}`).catch(() => undefined),
    );

    const agentDeletions = Array.from(idsToDelete).map((id) => deleteData(`agents/${id}`));

    await Promise.all([...logDeletions, ...ipBanDeletions, ...agentDeletions]);
}

export const getStandaloneKeys = async (): Promise<StandaloneKey[]> => {
    const data = await fetchData<Record<string, Omit<StandaloneKey, 'id'>>>('standalone_keys');
    return firebaseObjectToArray(data);
}

export const addStandaloneKey = async (key: Omit<StandaloneKey, 'id'> & {id: string}): Promise<void> => {
    const { id, ...keyData } = key;
    await setData(`standalone_keys/${id}`, keyData);
}

export const updateStandaloneKey = async(key: StandaloneKey): Promise<void> => {
    const { id, ...keyData } = key;
    await setData(`standalone_keys/${id}`, keyData);
}

export const deleteStandaloneKey = async(keyId: string): Promise<void> => {
    await deleteData(`standalone_keys/${keyId}`);
}

const normalizeUsageModes = (incoming?: unknown): UsageMode[] => {
    if (Array.isArray(incoming)) {
        const filtered = incoming.filter((mode): mode is UsageMode => mode === 'token' || mode === 'duration');
        if (filtered.length > 0) {
            return filtered;
        }
    } else if (incoming === 'token' || incoming === 'duration') {
        return [incoming];
    }

    return ['token'];
};

export const getBots = async (): Promise<Bot[]> => {
    const data = await fetchData<Record<string, Omit<Bot, 'id'>>>('bots');
    return firebaseObjectToArray(data).map((bot) => ({
        ...bot,
        usageModes: normalizeUsageModes((bot as Bot).usageModes),
    }));
};

export const addBot = async (bot: Omit<Bot, 'id'> & {id: string}): Promise<void> => {
    const { id, ...botData } = bot;
    await setData(`bots/${id}`, botData);
};

export const updateBot = async (bot: Bot): Promise<void> => {
    const { id, ...botData } = bot;
    await setData(`bots/${id}`, botData);
};

export const deleteBot = async (botId: string): Promise<void> => {
    await deleteData(`bots/${botId}`);
};

export const getApplications = async (): Promise<Application[]> => {
    const data = await fetchData<Record<string, Omit<Application, 'id'>>>('apps');
    return firebaseObjectToArray(data);
};

export const addApplication = async (app: Omit<Application, 'id'> & { id: string }): Promise<void> => {
    const { id, ...appData } = app;
    await setData(`apps/${id}`, appData);
};

export const updateApplication = async (app: Application): Promise<void> => {
    const { id, ...appData } = app;
    await setData(`apps/${id}`, appData);
};

export const deleteApplication = async (appId: string): Promise<void> => {
    await deleteData(`apps/${appId}`);
};

export const getKeyLogs = async (): Promise<KeyLog[]> => {
    const data = await fetchData<Record<string, Omit<KeyLog, 'id'>>>('key_logs');
    return firebaseObjectToArray(data);
};

export const recordKeyLog = async (log: Omit<KeyLog, 'id'>): Promise<void> => {
    await fetch(`${FIREBASE_URL}key_logs.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
    });
};

export const getIpBans = async (userId: string): Promise<IpBan[]> => {
    const data = await fetchData<Record<string, Omit<IpBan, 'id'>>>(`ip_bans/${userId}`);
    return firebaseObjectToArray(data);
};

export const addIpBan = async (userId: string, ip: string): Promise<void> => {
    const entry = { ip, userId, createdAt: new Date().toISOString() };
    await fetch(`${FIREBASE_URL}ip_bans/${userId}.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
    });
};

export const deleteIpBan = async (userId: string, id: string): Promise<void> => {
    await deleteData(`ip_bans/${userId}/${id}`);
};

const sanitizeIsoDate = (value?: string): string | undefined => {
    if (typeof value !== 'string') {
        return undefined;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return undefined;
    }
    return date.toISOString();
};

const defaultMaintenanceConfig: MaintenanceConfig = {
    enabled: false,
    message: 'ระบบกำลังปิดปรับปรุงเพื่ออัปเดต',
    allowedAdminIps: [],
    scheduledStart: undefined,
    scheduledEnd: undefined,
};

export const getMaintenanceConfig = async (): Promise<MaintenanceConfig> => {
    try {
        const data = await fetchData<MaintenanceConfig | null>('maintenance_config');
        if (data) {
            return {
                ...defaultMaintenanceConfig,
                ...data,
                allowedAdminIps: Array.isArray(data.allowedAdminIps)
                    ? data.allowedAdminIps.filter((ip) => typeof ip === 'string' && ip.trim().length > 0)
                    : defaultMaintenanceConfig.allowedAdminIps,
                scheduledStart: sanitizeIsoDate(data.scheduledStart),
                scheduledEnd: sanitizeIsoDate(data.scheduledEnd),
            };
        }
    } catch (error) {
        console.error('Failed to fetch maintenance config:', error);
    }

    return { ...defaultMaintenanceConfig };
};

export const saveMaintenanceConfig = async (config: MaintenanceConfig): Promise<void> => {
    await setData('maintenance_config', config);
};
