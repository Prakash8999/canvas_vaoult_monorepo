import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { combinedOpenApiDoc } from './common/docs';
import cors from 'cors';
import dotenv from 'dotenv';
const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();
app.use(express.json());
dotenv.config();
app.use(cors({ origin: ['http://localhost:8080'] , methods: ['GET', 'POST', 'PATCH', 'DELETE'], credentials: true }));





// Import all models to ensure they are registered with Sequelize

// Import routes
import userRoutes from './modules/users/user.route';
import assetRoutes from './modules/assets/asset.route';
import noteRoutes from './modules/notes/notes.route';

// Use routes

import redisClient, { connectRedis } from './config/redis';
async function initApp() {
  try {
    await connectRedis();
    const result = await redisClient.ping();
    console.log('Redis is working! PING =>', result);
  } catch (err) {
    console.error('Redis connection failed:', err);
  }
}
import  './jobs/otp.worker';
// later on shutdown:
// Use a signal handler to close the worker gracefully
// async function workers() {
  // await otpWorker.close();
  //  otpWorker.close();
// } 
// workers()
initApp();


app.get('/', (req, res) => {
  res.send({ message: 'Hello API from user service' });
});
app.use('/api-docs', ...swaggerUi.serve, swaggerUi.setup(combinedOpenApiDoc));

const apiV1 = '/api/v1'
app.use(`${apiV1}/user`, userRoutes);
app.use(`${apiV1}/assets`, assetRoutes);
app.use(`${apiV1}/note`, noteRoutes);

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
