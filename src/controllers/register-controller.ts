import { ValidationError } from "yup";
import statusCodes from "../constants/statusCodes.js";
import catchAsync from "../utils/catchAsync.js";
import { failed_response, success_response } from "../utils/response.js";
import {
    addContactDetailsSchema,
    addLocationDetailsSchema,
    addProfileDetailsSchema,
    createOrganizerSchema,
    emailOtpVerifySchema,
    emailValidate,
    loginSchema,
} from "../utils/yupValidations.js";
import registerService from "../service/register-service.js";
import catchErrorMsgAndStatusCode from "../utils/catchError.js";
import { clearAuthCookies, setAuthCookies } from "../utils/cookies.js";
import sessionModel from "../models/session.model.js";
import { verifyToken } from "../utils/jwt.js";

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
            await emailOtpVerifySchema.validate({ ...req.body, userAgent: req.headers['user-agent'] }, { abortEarly: false });
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
                            { error: error?.errors },
                            false
                        )
                    );
            }
        }

        // 2.call login service
        const { email, password } = req.body;

        const response = await registerService.loginService(email, password);

        // 3.return response
        return res.status(statusCodes.CREATED).json(success_response(statusCodes.CREATED, "Login OTP is Sent.", response, true));
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
            await emailOtpVerifySchema.validate({ ...req.body, userAgent: req.headers['user-agent'] }, { abortEarly: false });
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
        const userAgent = req.headers['user-agent'] || "";
        const { user, accessToken, refreshToken } = await registerService.loginOtpVerifyService(otp_number, otp_reference, userAgent);

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
    logout
};

export default registerController;
