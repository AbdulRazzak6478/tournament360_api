import { Router } from 'express';
import registerController from '../../controllers/register-controller.js';
const router = Router();

// 1.Registration flow
// send otp to verify email for registration
router.post("/organizer/register/send-Otp-Verify", registerController.sentOtpToVerifyEmail);

// verify organizer email otp
router.post("/organizer/register/verify-email-otp",registerController.verifyEmailOTP);

// create user account : step 1
router.post("/organizer/register/create",registerController.createOrganizer);

// add contact details : step 2
router.post("/organizer/register/add-Contact",registerController.addContactDetails);

// add profile details :step 3
router.post("/organizer/register/add-profile",registerController.addProfileDetails);

// add location :step 4
router.post("/organizer/register/add-location",registerController.addLocationDetails);

// *****************************************************************************

// 2.check email is signed up or not
router.get("/organizer/check-signedUp",registerController.checkOrganizerSignedUp);

// *****************************************************************************

// 3. Login flow ---- two step verification
// login 1st step : check credentials
router.post('/auth/login')

// login 2nd step : verify email otp
router.post('/auth/login-otp')







export default router;
