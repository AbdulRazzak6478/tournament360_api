import { Router } from "express";
import registerController from "../controllers/register.controller.js";

const router = Router();


// 1. Login flow ---- two step verification
// login 1st step : check credentials
//@route : POST /auth/login
//@desc  : Login User
//@access: Public to Users
router.post('/login', registerController.login);

// login 2nd step : verify email otp
//@route : POST /auth/login-otp
//@desc  : Login User OTP verification
//@access: Private to Users
router.post('/login-otp', registerController.loginOTPVerify);

// *********************************************************************************************

// 2.Logout user
//@route : POST /auth/logout
//@desc  : logout User
//@access: Private to Users
router.post("/logout", registerController.logout);

// **************************************************************************************

// 3.refresh accessToken
//@route : POST /auth/refresh
//@desc  : refresh User refresh token
//@access: Private to Users
router.post('/refresh', registerController.refreshHandler);

// *****************************************************************************************

// 4. Reset Password || forgot password
// send otp to reset password request
//@route : POST /auth/send-reset-otp
//@desc  : Sent OTP to reset the password
//@access: Public to Users
router.post('/send-reset-otp', registerController.sentResetPasswordOTP);

// verify reset password otp
//@route : POST /auth/verify-reset-otp
//@desc  : Verify OTP to reset the password
//@access: Public to Users
router.post('/verify-reset-otp', registerController.verifyResetPasswordOTP);

// reset password update 
//@route : POST /auth/reset-password
//@desc  : reset the password
//@access: Private to Users
router.post('/reset-password', registerController.resetPasswordUpdate);

// ****************************************************************************************



export default router;