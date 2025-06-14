import { Router } from 'express';
import adminController from '../controllers/admin.controller.js';
const router = Router();

// create admin 
router.post('/create',adminController.createAdmin);

export default router;