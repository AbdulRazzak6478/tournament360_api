import { Router } from 'express';
import adminController from '../controllers/adminController.js';
const router = Router();

// create admin 
router.post('/create',adminController.createAdmin);

export default router;