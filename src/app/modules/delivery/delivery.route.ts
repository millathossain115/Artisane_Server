import express from 'express';
import { DeliveryControllers } from './delivery.controller.js';

const router = express.Router();

router.post('/webhook/steadfast', DeliveryControllers.steadfastWebhook);

export const DeliveryRoutes = router;
