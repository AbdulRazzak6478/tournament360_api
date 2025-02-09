import { Router } from 'express';
import registerController from '../controllers/register-controller.js';
const router = Router();

// 1.Registration flow
// send otp to verify email for registration
router.post("/register/send-Otp-Verify", registerController.sentOtpToVerifyEmail);

// verify organizer email otp
router.post("/register/verify-email-otp", registerController.verifyEmailOTP);

// create user account : step 1
router.post("/register/create", registerController.createOrganizer);

// add contact details : step 2
router.post("/register/add-Contact", registerController.addContactDetails);

// add profile details :step 3
router.post("/register/add-profile", registerController.addProfileDetails);

// add location :step 4
router.post("/register/add-location", registerController.addLocationDetails);

// *****************************************************************************

// 2.check email is signed up or not
router.get("/check-signedUp/:email", registerController.checkOrganizerSignedUp);

// *****************************************************************************








export default router;
