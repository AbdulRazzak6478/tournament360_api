import { Router } from 'express';
import registerController from '../../../controllers/register-controller.js';

const router = Router();

// send otp to verify email for registration
router.post("/register/send-Otp-Verify", registerController.sentOtpToVerifyEmail);

// verify organizer email otp
router.post("/register/verify-email-otp",registerController.verifyEmailOTP);

// create user account : step 1
router.post("/register/create",registerController.createOrganizer);

// add contact details
router.post("/register/add-Contact");

// add profile details
router.post("/register/add-profile");

// add location 
router.post("/register/add-location");




export default router;