import { Router } from 'express';
import organizerRoutes from "./organizer/index.js";
const router = Router();

// Organizer register and login endpoints
router.use("/organizer",organizerRoutes);




export default router;