import { Router } from 'express';
import adminController from '../controllers/admin.controller.js';
const router = Router();

// create admin 
// @route: POST /api/v1/admin/create
// @desc:  Create Admin Of Platform
// @access: public
router.post('/create', adminController.createAdmin);

export default router;