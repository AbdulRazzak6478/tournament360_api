import { ValidationError } from "yup";
import statusCodes from "../constants/statusCodes.js";
import catchAsync from "../utils/catchAsync.js";
import { failed_response, success_response } from "../utils/response.js";
import { createOrganizerSchema, emailOtpVerifySchema, emailValidate } from "../utils/yupValidations.js";
import registerService from "../service/register-service.js";
import catchErrorMsgAndStatusCode from "../utils/catchError.js";

const sentOtpToVerifyEmail = catchAsync(async (req, res) => {
    try {
        // validate email 
        // call the sent otp service
        // return response
        try {
            await emailValidate.validate(req.body.email);
            console.log("after email")
        } catch (error) {
            if (error instanceof ValidationError) {
                console.log("Yup validation error in verify email: ", error?.message);
                return res.status(statusCodes.BAD_REQUEST).json(failed_response(statusCodes.BAD_REQUEST, "Yup validation failed", { error: error?.message }, false));
            }
        }
        const response = await registerService.sentOtpToEmail(req.body?.email);

        return res.status(statusCodes.CREATED).json(success_response(statusCodes.CREATED, "verify email OTP is sent", { ...response }, true));
    }
    catch (error) {
        console.log("Error in sent email verify otp controller : ", error);
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res.status(statusCode).json(failed_response(statusCode, "failed to sent email verify OTP", { message: message }, false))
    }
});

const verifyEmailOTP = catchAsync(async (req, res) => {
    try {
        console.log("req.body : ",req.body);
        // 1.validate otp and reference id
        try {
            await emailOtpVerifySchema.validate(req.body, { abortEarly: false });
        } catch (error) {
            if (error instanceof ValidationError) {
                console.log("Yup validation error in verify email: ", error?.message);
                return res.status(statusCodes.BAD_REQUEST).json(failed_response(statusCodes.BAD_REQUEST, "Yup validation failed", { error: error?.errors }, false));
            }
        }
        // 2.call otp verify service 
        const result = await registerService.verifyEmailOtp(req.body.otp_number, req.body.otp_reference);
        // 3. return response
        return res.status(statusCodes.OK).json(success_response(statusCodes.OK, "OTP is Verified", result, true));
    } catch (error) {
        console.log("Error in verify email otp controller : ",error);
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res.status(statusCode).json(failed_response(statusCode, "failed to verify email OTP", { message: message }, false))
    }
});

const createOrganizer = catchAsync(async (req, res) => {
    try {
        // 1. validate request email,password,referenceID
        try {
            await createOrganizerSchema.validate({ ...req.body }, { abortEarly: false });
        } catch (error) {
            if (error instanceof ValidationError) {
                console.log("Yup validation error in create organizer : ", error?.message);
                return res.status(statusCodes.BAD_REQUEST).json(failed_response(statusCodes.BAD_REQUEST, "Yup validation failed", { error: error?.errors }, false));
            }
        }
        // call create organizer service
        const { email, referenceID, password } = req.body;
        const result = await registerService.createOrganizeAccount(referenceID, email, password);
        // return response
        return res.status(statusCodes.CREATED).json(success_response(statusCodes.CREATED, "Password is set.", result, true));
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res.status(statusCode).json(failed_response(statusCode, "failed to create Account", { message: message }, false))
    }
})

const registerController = {
    sentOtpToVerifyEmail,
    verifyEmailOTP,
    createOrganizer
}

export default registerController;