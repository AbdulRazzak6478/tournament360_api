import { Router } from 'express';
import InfoController from '../controllers/infoController.js';
import v1Routes from "./organizer.routes.js"

const router = Router();
//test it
router.get('/info', InfoController);


router.use("/organizer", v1Routes);




export default router;