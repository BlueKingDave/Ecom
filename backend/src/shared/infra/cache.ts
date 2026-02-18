import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let _client: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (!_client) {
    _client = createClient({ url: redisUrl });
    await _client.connect();
  }
  return _client;
}
