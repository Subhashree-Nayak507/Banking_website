import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;


const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,        // Retry 3 times if connection fails
  enableReadyCheck: true,          // Check if Redis is ready
  connectTimeout: 10000,           // 10 seconds timeout
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000); // Max 2 seconds delay
    return delay;
  }
});

redis.on('connect', () => {
  console.log('📡 Connecting to Redis Cloud...');
  console.log('REDIS_URL:', process.env.REDIS_URL);
});

redis.on('ready', () => {
  console.log('✅ Redis Cloud connected successfully!');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

redis.on('close', () => {
  console.log('⚠️  Redis connection closed');
});

process.on('SIGINT', async () => {
  await redis.quit();
  console.log('👋 Redis connection closed gracefully');
  process.exit(0);
});

export default redis;