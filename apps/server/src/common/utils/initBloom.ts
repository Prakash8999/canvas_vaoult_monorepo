// import redisClient from "../../config/redis";

// const BLOOM_KEY = "user:emails";

// export const initBloomFilter = async () => {
//   if (!redisClient.isOpen) {
//     await redisClient.connect();
//   }

//   try {
//     // bf.reserve takes key, error rate, capacity
//     await redisClient.bf.reserve(BLOOM_KEY, 0.01, 1000000);
//     console.log(`Bloom filter '${BLOOM_KEY}' created ✅`);
//   } catch (err: any) {
//     if (err.message.includes("item exists") || err.message.includes("exists")) {
//       console.log(`Bloom filter '${BLOOM_KEY}' already exists, skipping...`);
//     } else {
//       throw err;
//     }
//   }
// };
