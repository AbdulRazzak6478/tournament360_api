import { Router } from "express";
import registerController from "../controllers/register-controller.js";


const router = Router();


// 1. Login flow ---- two step verification
// login 1st step : check credentials
router.post('/login',registerController.login)

// login 2nd step : verify email otp
router.post('/login-otp',registerController.loginOTPVerify);

// *********************************************************************************************

// 2.Logout user
router.post("/logout",registerController.logout);

// **************************************************************************************

// 3.refresh accessToken
router.post('/refresh',registerController.refreshHandler);

// 4. Reset Password || forgot password
// send otp to reset password request
router.post('/send-reset-otp');

// verify reset password otp
router.post('/verify-reset-otp');

// reset password update 
router.post('/reset-password')

export default router;