// 메모리 저장소 (KV가 설정되지 않은 경우 fallback)
// 주의: Serverless 환경에서는 각 요청마다 초기화될 수 있음
const memoryStore = new Map<string, string>();

export const kvStore = {
    async get<T>(key: string): Promise<T | null> {
        // KV 환경변수가 있는지 런타임에 확인
        if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
            try {
                const { kv } = await import('@vercel/kv');
                return await kv.get<T>(key);
            } catch (error) {
                console.error('KV get error:', error);
            }
        }
        // fallback to memory
        const stored = memoryStore.get(key);
        return stored ? JSON.parse(stored) : null;
    },

    async set(key: string, value: any): Promise<void> {
        if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
            try {
                const { kv } = await import('@vercel/kv');
                await kv.set(key, value);
                return;
            } catch (error) {
                console.error('KV set error:', error);
            }
        }
        // fallback to memory
        memoryStore.set(key, JSON.stringify(value));
    },

    async del(key: string): Promise<void> {
        if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
            try {
                const { kv } = await import('@vercel/kv');
                await kv.del(key);
                return;
            } catch (error) {
                console.error('KV del error:', error);
            }
        }
        // fallback to memory
        memoryStore.delete(key);
    },
};
