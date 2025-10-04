import { createClient } from 'redis';


if (!process.env.REDIS_HOST) {
  console.error('REDIS_HOST is not defined');
  throw new Error('REDIS_HOST is not defined in environment variables');
}

const redisClient = createClient({
  url: process.env.REDIS_HOST ,
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

redisClient.on('ready', () => {
  console.log('Redis client ready');
});

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

export { connectRedis };
export default redisClient;
