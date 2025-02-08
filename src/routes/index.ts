import { Router } from 'express';
import InfoController from '../controllers/infoController.js';
import v1Routes from "./v1/organizer.routes.js"

const router = Router();
//test it
router.get('/info', InfoController);


router.use("/v1",v1Routes);




export default router;