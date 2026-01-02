import { createClient, RedisClientType } from 'redis';

// Redis 클라이언트 싱글톤
let redisClient: RedisClientType | null = null;

async function getRedisClient(): Promise<RedisClientType | null> {
    if (!process.env.REDIS_URL) {
        return null;
    }

    if (!redisClient) {
        redisClient = createClient({
            url: process.env.REDIS_URL,
        });

        redisClient.on('error', (err) => console.error('Redis Client Error', err));

        await redisClient.connect();
    }

    return redisClient;
}

// 메모리 저장소 (Redis가 설정되지 않은 경우 fallback)
const memoryStore = new Map<string, string>();

export const kvStore = {
    async get<T>(key: string): Promise<T | null> {
        try {
            const client = await getRedisClient();
            if (client) {
                const result = await client.get(key);
                return result ? JSON.parse(result) : null;
            }
        } catch (error) {
            console.error('Redis get error:', error);
        }
        // fallback to memory
        const stored = memoryStore.get(key);
        return stored ? JSON.parse(stored) : null;
    },

    async set(key: string, value: any): Promise<void> {
        try {
            const client = await getRedisClient();
            if (client) {
                await client.set(key, JSON.stringify(value));
                return;
            }
        } catch (error) {
            console.error('Redis set error:', error);
        }
        // fallback to memory
        memoryStore.set(key, JSON.stringify(value));
    },

    async del(key: string): Promise<void> {
        try {
            const client = await getRedisClient();
            if (client) {
                await client.del(key);
                return;
            }
        } catch (error) {
            console.error('Redis del error:', error);
        }
        // fallback to memory
        memoryStore.delete(key);
    },
};
