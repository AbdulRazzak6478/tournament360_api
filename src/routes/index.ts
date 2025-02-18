import { Router } from 'express';
import InfoController from '../controllers/infoController.js';
import organizerRoutes from "./organizer.routes.js";
import subordinateRoutes from "./subordinate.routes.js"
import subAdminRoutes from "./subadmin.routes.js"
import AdminRoutes from "./admin.routes.js"

const router = Router();
//test it
router.get('/info', InfoController);


router.use('/admin', AdminRoutes);
router.use('/subAdmin', subAdminRoutes);
router.use("/organizer", organizerRoutes);
router.use('/subordinate', subordinateRoutes);




export default router;