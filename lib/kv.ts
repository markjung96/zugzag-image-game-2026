import { kv } from '@vercel/kv';

// 개발 환경에서는 메모리 저장소 사용
const memoryStore = new Map<string, any>();

const isProduction = process.env.VERCEL_ENV === 'production';

export const kvStore = {
    async get<T>(key: string): Promise<T | null> {
        if (isProduction) {
            return await kv.get<T>(key);
        }
        return memoryStore.get(key) || null;
    },

    async set(key: string, value: any): Promise<void> {
        if (isProduction) {
            await kv.set(key, value);
        } else {
            memoryStore.set(key, value);
        }
    },

    async del(key: string): Promise<void> {
        if (isProduction) {
            await kv.del(key);
        } else {
            memoryStore.delete(key);
        }
    },
};
