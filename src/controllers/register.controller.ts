import { ValidationError } from "yup";
import statusCodes from "../constants/status-codes.constant.js";
import catchAsync from "../utils/catch-async.util.js";
import { failed_response, success_response } from "../utils/response.util.js";
import {
    addContactDetailsSchema,
    addLocationDetailsSchema,
    addProfileDetailsSchema,
    createOrganizerSchema,
    emailOtpVerifySchema,
    emailValidate,
    loginSchema,
    resetPasswordSchema,
} from "../utils/yup-validations.util.js";
import registerService from "../services/register.service.js";
import catchErrorMsgAndStatusCode from "../utils/catch-error.util.js";
import { clearAuthCookies, setAuthCookies } from "../utils/cookies.util.js";
import sessionModel from "../models/session.model.js";
import { verifyToken } from "../utils/jwt.util.js";
import appErrorAssert from "../utils/app-assert.util.js";

const sentOtpToVerifyEmail = catchAsync(async (req, res) => {
    try {
        // validate email
        // call the sent otp service
        // return response
        try {
            await emailValidate.validate(req.body.email);
            console.log("after email");
        } catch (error) {
            if (error instanceof ValidationError) {
                console.log("Yup validation error in verify email: ", error?.message);
                return res
                    .status(statusCodes.BAD_REQUEST)
                    .json(
                        failed_response(
                            statusCodes.BAD_REQUEST,
                            "Yup validation failed",
                            { error: error?.message },
                            false
                        )
                    );
            }
        }
        const response = await registerService.sentOtpToEmail(req.body?.email);

        return res
            .status(statusCodes.CREATED)
            .json(
                success_response(
                    statusCodes.CREATED,
                    "verify email OTP is sent",
                    { ...response },
                    true
                )
            );
    } catch (error) {
        console.log("Error in sent email verify otp controller : ", error);
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res
            .status(statusCode)
            .json(
                failed_response(
                    statusCode,
                    "failed to sent email verify OTP",
                    { message: message },
                    false
                )
            );
    }
});

const verifyEmailOTP = catchAsync(async (req, res) => {
    try {
        console.log("req.body : ", req.body);
        // 1.validate otp and reference id
        try {
            await emailOtpVerifySchema.validate(
                { ...req.body, userAgent: req.headers["user-agent"] },
                { abortEarly: false }
            );
        } catch (error) {
            if (error instanceof ValidationError) {
                console.log("Yup validation error in verify email: ", error?.message);
                return res
                    .status(statusCodes.BAD_REQUEST)
                    .json(
                        failed_response(
                            statusCodes.BAD_REQUEST,
                            "Yup validation failed",
                            { error: error?.errors },
                            false
                        )
                    );
            }
        }
        // 2.call otp verify service
        const result = await registerService.verifyEmailOtp(
            req.body.otp_number,
            req.body.otp_reference
        );
        // 3. return response
        return res
            .status(statusCodes.OK)
            .json(success_response(statusCodes.OK, "OTP is Verified", result, true));
    } catch (error) {
        console.log("Error in verify email otp controller : ", error);
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res
            .status(statusCode)
            .json(
                failed_response(
                    statusCode,
                    "failed to verify email OTP",
                    { message: message },
                    false
                )
            );
    }
});

const createOrganizer = catchAsync(async (req, res) => {
    try {
        // 1. validate request email,password,referenceID
        try {
            await createOrganizerSchema.validate(
                { ...req.body },
                { abortEarly: false }
            );
        } catch (error) {
            if (error instanceof ValidationError) {
                console.log(
                    "Yup validation error in create organizer : ",
                    error?.message
                );
                return res
                    .status(statusCodes.BAD_REQUEST)
                    .json(
                        failed_response(
                            statusCodes.BAD_REQUEST,
                            "Yup validation failed",
                            { error: error?.errors },
                            false
                        )
                    );
            }
        }
        // call create organizer service
        const { email, referenceID, password } = req.body;
        const result = await registerService.createOrganizeAccount(
            referenceID,
            email,
            password
        );
        // return response
        return res
            .status(statusCodes.CREATED)
            .json(
                success_response(statusCodes.CREATED, "Password is set.", result, true)
            );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res
            .status(statusCode)
            .json(
                failed_response(
                    statusCode,
                    "failed to create Account",
                    { message: message },
                    false
                )
            );
    }
});

const addContactDetails = catchAsync(async (req, res) => {
    try {
        // 1.validate request contact details
        try {
            await addContactDetailsSchema.validate(
                { ...req.body },
                { abortEarly: false }
            );
        } catch (error) {
            if (error instanceof ValidationError) {
                console.log(
                    "Yup validation error in add organizer contact details : ",
                    error?.message
                );
                return res
                    .status(statusCodes.BAD_REQUEST)
                    .json(
                        failed_response(
                            statusCodes.BAD_REQUEST,
                            "Yup validation failed",
                            { error: error?.errors },
                            false
                        )
                    );
            }
        }
        // 2.call service
        const payload = {
            id: req.body.id,
            mobileNumber: req.body.mobileNumber,
            alternativeMobileNumber: req.body.alternativeMobileNumber,
        };
        const result = await registerService.addOrganizerContactDetails(payload);
        // 3.return response;
        return res
            .status(statusCodes.OK)
            .json(
                success_response(statusCodes.OK, "Contact Details Added.", result, true)
            );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res
            .status(statusCode)
            .json(
                failed_response(
                    statusCode,
                    "failed to add contact details",
                    { message: message },
                    false
                )
            );
    }
});

const addProfileDetails = catchAsync(async (req, res) => {
    try {
        // 1.validate request contact details
        try {
            await addProfileDetailsSchema.validate(
                { ...req.body },
                { abortEarly: false }
            );
        } catch (error) {
            if (error instanceof ValidationError) {
                console.log(
                    "Yup validation error in add organizer profile details : ",
                    error?.message
                );
                return res
                    .status(statusCodes.BAD_REQUEST)
                    .json(
                        failed_response(
                            statusCodes.BAD_REQUEST,
                            "Yup validation failed",
                            { error: error?.errors },
                            false
                        )
                    );
            }
        }
        // 2.call service
        const payload = {
            FirstName: req.body.firstName,
            LastName: req.body.lastName,
            dob: req.body.dob,
            gender: req.body.gender,
            profession: req.body.profession,
        };
        const result = await registerService.addOrganizerProfileDetails(
            req.body.id,
            payload
        );
        // 3.return response;
        return res
            .status(statusCodes.OK)
            .json(
                success_response(statusCodes.OK, "Profile Details Added.", result, true)
            );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        console.log(
            "error in add organizer profile details controller : ",
            message
        );
        return res
            .status(statusCode)
            .json(
                failed_response(
                    statusCode,
                    "failed to add profile details",
                    { message: message },
                    false
                )
            );
    }
});

const addLocationDetails = catchAsync(async (req, res) => {
    try {
        // 1. validate location request
        try {
            await addLocationDetailsSchema.validate(
                { ...req.body, userAgent: req.headers["user-agent"] },
                { abortEarly: false }
            );
        } catch (error) {
            if (error instanceof ValidationError) {
                console.log(
                    "Yup validation error in add organizer profile details : ",
                    error?.message
                );
                return res
                    .status(statusCodes.BAD_REQUEST)
                    .json(
                        failed_response(
                            statusCodes.BAD_REQUEST,
                            "Yup validation failed",
                            { error: error?.errors },
                            false
                        )
                    );
            }
        }
        // 2.call the service
        const payload = {
            address: req.body.address,
            pinCode: req.body.pinCode,
            city: req.body.city,
            state: req.body.state,
            country: req.body.country,
            userAgent: req.headers["user-agent"] || "",
        };
        const { refreshToken, accessToken, organizer } =
            await registerService.addOrganizerLocationDetails(req.body.id, payload);

        // 3. return response with tokens into cookies
        return setAuthCookies({ res, accessToken, refreshToken })
            .status(statusCodes.CREATED)
            .json(
                success_response(
                    statusCodes.CREATED,
                    "Location details added",
                    {
                        organizer,
                        message: "All steps are completed.",
                        accessToken,
                        refreshToken,
                    },
                    true
                )
            );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        console.log(
            "error in add organizer location details controller : ",
            message
        );
        return res
            .status(statusCode)
            .json(
                failed_response(
                    statusCode,
                    "failed to add location details",
                    { message: message },
                    false
                )
            );
    }
});

const checkOrganizerSignedUp = catchAsync(async (req, res) => {
    try {
        // 1. validate email
        try {
            await emailValidate.validate(req.params.email, { abortEarly: false });
        } catch (error) {
            if (error instanceof ValidationError) {
                console.log(
                    "Yup validation error in check organizer signedUp details : ",
                    error?.message
                );
                return res
                    .status(statusCodes.BAD_REQUEST)
                    .json(
                        failed_response(
                            statusCodes.BAD_REQUEST,
                            "Yup validation failed",
                            { error: error?.errors },
                            false
                        )
                    );
            }
        }

        // 2. call service
        const response = await registerService.checkIsSignedUp(req.params.email);

        // 3.return response
        return res
            .status(statusCodes.OK)
            .json(
                success_response(
                    statusCodes.OK,
                    "Registered Successfully.",
                    response,
                    true
                )
            );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        console.log("error in check login controller : ", message);
        return res
            .status(statusCode)
            .json(
                failed_response(
                    statusCode,
                    "failed to fetch Organizer ",
                    { message: message },
                    false
                )
            );
    }
});

const login = catchAsync(async (req, res) => {
    try {
        // 1.validate request payload
        try {
            await loginSchema.validate(req.body, { abortEarly: false });
        } catch (error) {
            if (error instanceof ValidationError) {
                console.log(
                    "Yup validation error in login controller : ",
                    error?.message
                );
                return res
                    .status(statusCodes.BAD_REQUEST)
                    .json(
                        failed_response(
                            statusCodes.BAD_REQUEST,
                            "Yup validation failed",
                            { message: error?.message, error: error?.errors },
                            false
                        )
                    );
            }
        }

        // 2.call login service
        const { email, password } = req.body;

        const response = await registerService.loginService(email, password);

        // 3.return response
        return res
            .status(statusCodes.CREATED)
            .json(
                success_response(
                    statusCodes.CREATED,
                    "Login OTP is Sent.",
                    response,
                    true
                )
            );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        console.log("error in login controller : ", message);
        return res
            .status(statusCode)
            .json(
                failed_response(
                    statusCode,
                    "failed to login user",
                    { message: message },
                    false
                )
            );
    }
});

const loginOTPVerify = catchAsync(async (req, res) => {
    try {
        // 1.validate login otp request
        try {
            await emailOtpVerifySchema.validate(
                { ...req.body, userAgent: req.headers["user-agent"] },
                { abortEarly: false }
            );
        } catch (error) {
            if (error instanceof ValidationError) {
                console.log(
                    "Yup validation error in login otp Verify controller : ",
                    error?.message
                );
                return res
                    .status(statusCodes.BAD_REQUEST)
                    .json(
                        failed_response(
                            statusCodes.BAD_REQUEST,
                            "Yup validation failed",
                            { error: error?.errors },
                            false
                        )
                    );
            }
        }

        // 2.call the service
        const { otp_number, otp_reference } = req.body;
        const userAgent = req.headers["user-agent"] || "";
        const { user, accessToken, refreshToken } =
            await registerService.loginOtpVerifyService(
                otp_number,
                otp_reference,
                userAgent
            );

        // 3.return with tokens and cookies

        return setAuthCookies({ res, accessToken, refreshToken })
            .status(statusCodes.CREATED)
            .json(
                success_response(
                    statusCodes.CREATED,
                    "OTP is verified",
                    {
                        user,
                        message: "user successfully login",
                        accessToken,
                        refreshToken,
                    },
                    true
                )
            );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        console.log("error in login otp verify controller : ", message);
        return res
            .status(statusCode)
            .json(
                failed_response(
                    statusCode,
                    "failed to verify login OTP",
                    { message: message },
                    false
                )
            );
    }
});

const logout = catchAsync(async (req, res) => {
    try {
        const accessToken = req.cookies.accessToken as string | undefined;

        const { payload } = verifyToken(accessToken || "");
        if (payload) {
            await sessionModel.findByIdAndDelete(payload?.sessionId);
        }

        return clearAuthCookies(res)
            .status(statusCodes.OK)
            .json(
                success_response(
                    statusCodes.OK,
                    "User Logout Successfully",
                    { message: "Logout successfully" },
                    true
                )
            );
    } catch (error) {
        let { message, statusCode } = catchErrorMsgAndStatusCode(error);
        return res
            .status(statusCode)
            .json(
                failed_response(
                    statusCode,
                    "Something went wrong while logging out from user account",
                    { message },
                    false
                )
            );
    }
});

const refreshHandler = catchAsync(async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken as string | undefined;
        appErrorAssert(
            refreshToken,
            statusCodes.BAD_REQUEST,
            "refreshToken is missing"
        );

        const { accessToken, newRefreshToken } =
            await registerService.refreshUserAccessToken(refreshToken);

        // send tokens in response
        return setAuthCookies({ res, accessToken, refreshToken: newRefreshToken })
            .status(statusCodes.OK)
            .json(
                success_response(
                    statusCodes.OK,
                    "User Refresh Token Successfully",
                    { message: "Refresh token successfully" },
                    true
                )
            );
    } catch (error) {
        let { message, statusCode } = catchErrorMsgAndStatusCode(error);
        return res
            .status(statusCode)
            .json(
                failed_response(
                    statusCode,
                    "failed to refresh token",
                    { message },
                    false
                )
            );
    }
});

const sentResetPasswordOTP = catchAsync(async (req, res) => {
    try {
        // 1.validate email
        try {
            await emailValidate.validate(req.body.email);
        } catch (error) {
            if (error instanceof ValidationError) {
                console.log("Yup validation error in verify email: ", error?.message);
                return res
                    .status(statusCodes.BAD_REQUEST)
                    .json(
                        failed_response(
                            statusCodes.BAD_REQUEST,
                            "Yup validation failed",
                            { error: error?.message },
                            false
                        )
                    );
            }
        }

        // 2.call the reset service
        const response = await registerService.sentResetOTPService(req.body.email);
        // 3.return response
        return res
            .status(statusCodes.CREATED)
            .json(
                success_response(
                    statusCodes.CREATED,
                    "Reset OTP is sent.",
                    response,
                    true
                )
            );
    } catch (error) {
        let { message, statusCode } = catchErrorMsgAndStatusCode(error);
        return res
            .status(statusCode)
            .json(
                failed_response(
                    statusCode,
                    "failed to sent reset OTP",
                    { message },
                    false
                )
            );
    }
});

const verifyResetPasswordOTP = catchAsync(async (req, res) => {
    try {
        // 1.validate otp and reference id
        try {
            await emailOtpVerifySchema.validate(
                { ...req.body, userAgent: req.headers["user-agent"] },
                { abortEarly: false }
            );
        } catch (error) {
            if (error instanceof ValidationError) {
                console.log(
                    "Yup validation error in verify reset password otp : ",
                    error?.message
                );
                return res
                    .status(statusCodes.BAD_REQUEST)
                    .json(
                        failed_response(
                            statusCodes.BAD_REQUEST,
                            "Yup validation failed",
                            { error: error?.errors },
                            false
                        )
                    );
            }
        }
        // 2. call the service
        const { otp_number, otp_reference } = req.body;

        const response = await registerService.verifyResetPasswordOTPService(
            otp_number,
            otp_reference
        );

        // 3. return referenceID
        return res
            .status(statusCodes.OK)
            .json(
                success_response(
                    statusCodes.OK,
                    "Reset password OTP is Verified.",
                    response,
                    true
                )
            );
    } catch (error) {
        let { message, statusCode } = catchErrorMsgAndStatusCode(error);
        return res
            .status(statusCode)
            .json(
                failed_response(
                    statusCode,
                    "failed to verify reset OTP",
                    { message },
                    false
                )
            );
    }
});

const resetPasswordUpdate = catchAsync(async (req, res) => {
    try {
        // 1.validate request data
        try {
            await resetPasswordSchema.validate(req.body, { abortEarly: false });
        } catch (error) {
            if (error instanceof ValidationError) {
                console.log(
                    "Yup validation error in verify reset password otp : ",
                    error?.message
                );
                return res
                    .status(statusCodes.BAD_REQUEST)
                    .json(
                        failed_response(
                            statusCodes.BAD_REQUEST,
                            "Yup validation failed",
                            { error: error?.errors },
                            false
                        )
                    );
            }
        }
        // 2.call the update password service
        const { password, referenceID } = req.body;
        const response = await registerService.resetPasswordService(
            password,
            referenceID
        );

        // 3.return response
        return res
            .status(statusCodes.OK)
            .json(
                success_response(
                    statusCodes.OK,
                    "Password is Updated Successfully.",
                    response,
                    true
                )
            );
    } catch (error) {
        let { message, statusCode } = catchErrorMsgAndStatusCode(error);
        return res
            .status(statusCode)
            .json(
                failed_response(
                    statusCode,
                    "failed to reset password",
                    { message },
                    false
                )
            );
    }
});

const registerController = {
    sentOtpToVerifyEmail,
    verifyEmailOTP,
    createOrganizer,
    addContactDetails,
    addProfileDetails,
    addLocationDetails,
    checkOrganizerSignedUp,
    login,
    loginOTPVerify,
    logout,
    refreshHandler,
    sentResetPasswordOTP,
    verifyResetPasswordOTP,
    resetPasswordUpdate,
};

export default registerController;
