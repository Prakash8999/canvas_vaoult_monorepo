import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { combinedOpenApiDoc } from './common/docs';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import userRoutes from './modules/users/user.route';
import assetRoutes from './modules/assets/asset.route';
import noteRoutes from './modules/notes/notes.route';
import canvasRoute from './modules/canvas/canvas.routes';
import qcRoute from './modules/quick-capture/qc.routes';
import aiRoute from './modules/ai/ai.route';

import redisClient, { connectRedis } from './config/redis';

// Load env early
dotenv.config();

const app = express();

// middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(
    cors({
        origin: [
            'http://localhost:8080',
            'https://canvas-note.vercel.app',
        ],
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        credentials: true,
    })
);

// ---- INIT SERVICES (SAFE FOR VERCEL) ----
async function initApp() {
    try {
        await connectRedis();
        const result = await redisClient.ping();
        console.log('Redis connected:', result);
    } catch (err) {
        console.error('Redis connection failed:', err);
    }
}

// IMPORTANT: call but DO NOT await (serverless safe)
initApp();

// background jobs
import './jobs/otp.worker';

// ---- ROUTES ----
app.get('/', (_req, res) => {
    res.json({ status: 'ok', service: 'canvas-vault-api' });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(combinedOpenApiDoc));

const apiV1 = '/api/v1';
app.use(`${apiV1}/user`, userRoutes);
app.use(`${apiV1}/assets`, assetRoutes);
app.use(`${apiV1}/note`, noteRoutes);
app.use(`${apiV1}/canvas`, canvasRoute);
app.use(`${apiV1}/quick-capture`, qcRoute);
app.use(`${apiV1}/ai`, aiRoute);

export default app;
