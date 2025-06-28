import { Router } from 'express';
import staffController from '../controllers/staff.controller.js';
const router = Router();

// create sub ordinate 
router.post('/create/:organizerId',staffController.createStaff);

export default router;