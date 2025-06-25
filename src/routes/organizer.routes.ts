import { Router } from 'express';
import registerController from '../controllers/register.controller.js';
const router = Router();

// 1.Registration flow

// @route  : POST  /api/v1/organizer/register/send-Otp-Verify
// @desc   : send otp to verify email for registration
// @access : Public To Merchant Only
router.post("/register/send-Otp-Verify", registerController.sentOtpToVerifyEmail);

// @route  : POST  /api/v1/organizer/register/verify-email-otp
// @desc   : verify organizer email otp
// @access : Public To Merchant Only
router.post("/register/verify-email-otp", registerController.verifyEmailOTP);

// @route  : POST  /api/v1/organizer/register/create
// @desc   : create user account : step 1
// @access : Public To Merchant Only
router.post("/register/create", registerController.createOrganizer);

// @route  : POST  /api/v1/organizer/register/add-Contact
// @desc   : add contact details : step 2
// @access : Public To Merchant Only
router.post("/register/add-Contact", registerController.addContactDetails);


// @route  : POST  /api/v1/organizer/register/add-profile
// @desc   : add profile details :step 3
// @access : Public To Merchant Only
router.post("/register/add-profile", registerController.addProfileDetails);


// @route  : POST  /api/v1/organizer/register/add-location
// @desc   : add location :step 4
// @access : Public To Merchant Only
router.post("/register/add-location", registerController.addLocationDetails);

// *****************************************************************************

// @route  : POST  /api/v1/organizer/check-signedUp/:email
// @desc   : check email is signed up or not
// @access : Public To Merchant Only
router.get("/check-signedUp/:email", registerController.checkOrganizerSignedUp);

// *****************************************************************************








export default router;
