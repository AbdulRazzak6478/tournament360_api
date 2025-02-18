import { Router } from 'express';
import subOrdinateController from '../controllers/SubOrdinate-controller.js';
const router = Router();

// create sub ordinate 
router.post('/create/:organizerId',subOrdinateController.createSubordinate);

export default router;