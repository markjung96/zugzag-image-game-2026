// 메모리 저장소 (KV가 설정되지 않은 경우 fallback)
const memoryStore = new Map<string, string>();

// Vercel KV 환경변수가 있는지 확인
const hasKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// 동적으로 kv import (환경변수가 있을 때만)
let kv: any = null;
if (hasKV) {
    try {
        kv = require('@vercel/kv').kv;
    } catch (e) {
        console.warn('Vercel KV not available, using memory store');
    }
}

export const kvStore = {
    async get<T>(key: string): Promise<T | null> {
        if (hasKV && kv) {
            try {
                return await kv.get<T>(key);
            } catch (error) {
                console.error('KV get error:', error);
                // fallback to memory
                const stored = memoryStore.get(key);
                return stored ? JSON.parse(stored) : null;
            }
        }
        const stored = memoryStore.get(key);
        return stored ? JSON.parse(stored) : null;
    },

    async set(key: string, value: any): Promise<void> {
        if (hasKV && kv) {
            try {
                await kv.set(key, value);
                return;
            } catch (error) {
                console.error('KV set error:', error);
                // fallback to memory
            }
        }
        memoryStore.set(key, JSON.stringify(value));
    },

    async del(key: string): Promise<void> {
        if (hasKV && kv) {
            try {
                await kv.del(key);
                return;
            } catch (error) {
                console.error('KV del error:', error);
                // fallback to memory
            }
        }
        memoryStore.delete(key);
    },
};
