import { Router } from 'express';
import subAdminController from '../controllers/sub-admin.controller.js';
const router = Router();

// create admin 
router.post('/create',subAdminController.createSuAdmin);

export default router;