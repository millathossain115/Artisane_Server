import express from 'express';
import { LocationControllers } from './location.controller.js';

const router = express.Router();

router.get('/districts', LocationControllers.getDistricts);
router.get(
  '/districts/:districtId/zones',
  LocationControllers.getZonesByDistrict,
);

export const LocationRoutes = router;
