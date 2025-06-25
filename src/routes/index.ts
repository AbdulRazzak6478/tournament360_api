import { Router } from 'express';
import InfoController from '../controllers/info.controller.js';
import organizerRoutes from "./organizer.routes.js";
import staffRoutes from "./staff.routes.js"
import subAdminRoutes from "./subadmin.routes.js"
import AdminRoutes from "./admin.routes.js"
import tournamentRoutes from "./tournament.routes.js"

const router = Router();
//test it
router.get('/info', InfoController);

// 1. Tournament Routes
// @route: /api/v1/tournament
router.use("/tournament", tournamentRoutes)



// 2.Admin Routes
// @route: /api/v1/admin
router.use('/admin', AdminRoutes);

// 3. subAdmin Routes
// @route: /api/v1/subAdmin
router.use('/subAdmin', subAdminRoutes);

// 4. organizer Routes
// @route: /api/v1/organizer
router.use("/organizer", organizerRoutes);

// 5. Subordinate or Staff Routes
// @route: /api/v1/subordinate
router.use('/staff', staffRoutes);




export default router;