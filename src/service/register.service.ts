import { refreshTokenOptions, signToken, verifyToken } from './../utils/jwt.js';
import mongoose from "mongoose";
import statusCodes from "../constants/statusCodes.js";
import verificationCodeType from "../constants/verificationCode.js";
import organizerModel, { locationDocument, IOrganizer } from "../models/Organizer.model.js";
import OtpModel from "../models/otp-model.js";
import userRoleModel from "../models/userRole.model.js";
import appErrorAssert from "../utils/appAssert.js";
import AppError from "../utils/appError.js";
import catchErrorMsgAndStatusCode from "../utils/catchError.js";
import { OneMinuteFromNow, thirtyDaysFromNow } from "../utils/dateHandlers.js";
import { sendOtpVerifyEmail, sentLoginVerifyOTP, sentResetOTPEmail, sentWelcomeEmail } from "../utils/sentEmail.js";
import { generateCustomID, generateOTP, generateUniqueReferenceID } from "../utils/uniqueIDs.js";
import sessionModel from "../models/session.model.js";
import GlobalUserModel from '../models/globalUsers.model.js';
import { comparePassword } from '../utils/helpers.js';
import { IStaff } from '../models/staff.model.js';
import { ISubAdmin } from '../models/subadmin.model.js';
import { IAdmin } from '../models/admin.model.js';

const sentOtpToEmail = async (email: string) => {
    try {
        console.log("email : ", email);

        // generate otp , reference id 
        const OTP = generateOTP();
        const referenceID = generateUniqueReferenceID();
        console.log("otp : ", OTP);
        console.log("referenceID : ", referenceID);

        // create a otp , reference record in model
        const data = {
            type: verificationCodeType.EmailVerification,
            email,
            otp_reference: referenceID,
            otp_number: OTP,
            expiresIn: OneMinuteFromNow() // 1 minute from now
        }
        console.log("data : ", data);
        const otpReference = await OtpModel.create(data);
        console.log("otpReference : ", otpReference);
        appErrorAssert(otpReference, statusCodes.BAD_REQUEST, "Not able to sent verify Email OTP");

        // send otp om email
        await sendOtpVerifyEmail(OTP, email);

        // return reference Id
        return { referenceID };
    } catch (error) {
        const { message, statusCode } = catchErrorMsgAndStatusCode(error);
        console.log("error in sent otp verify email service :", message);
        throw new AppError(statusCode, message);
    }
}

const verifyEmailOtp = async (Otp: number, referenceID: string) => {
    try {
        // 1.verify otp and referenceID
        const data = {
            type: verificationCodeType.EmailVerification,
            otp_reference: referenceID,
            otp_number: Otp,
        }
        const otpReference = await OtpModel.findOne(data);
        appErrorAssert(otpReference, statusCodes.NOT_FOUND, "Otp reference not found");
        const isOtpValid = otpReference?.expiresIn > new Date();
        appErrorAssert(isOtpValid, statusCodes.BAD_REQUEST, "OTP is Expired.");
        otpReference.isVerified = true;
        await otpReference.save();

        // 2.validate user if exist 
        const user = await GlobalUserModel.findOne({ email: otpReference.email });
        appErrorAssert(!user?.isSignedUp, statusCodes.BAD_REQUEST, "Email is already exist. Please Login");

        const organizer = await organizerModel.findOne({ email: otpReference.email });
        appErrorAssert(!organizer?.steps.fourth, statusCodes.BAD_REQUEST, "Email is already exist. Please Login");

        // 3.return required data if exist
        let payload = {};
        if (organizer) {
            payload = {
                organizer: organizer,
                exist: true,
                steps: organizer.steps,
            }
        } else {
            payload = {
                referenceID
            }
        }
        return payload
    } catch (error) {
        console.log("error in verify email otp service :", error);
        const { message, statusCode } = catchErrorMsgAndStatusCode(error);
        throw new AppError(statusCode, message);
    }
}

const createOrganizeAccount = async (referenceID: string, email: string, password: string) => {
    try {
        // 1.validate referenceID if it s verified or not
        const otpReference = await OtpModel.findOne({ otp_reference: referenceID, email: email });
        // check otp reference is present or not
        appErrorAssert(otpReference, statusCodes.NOT_FOUND, "Verification reference not found");
        // check email is verified or not
        appErrorAssert(otpReference?.isVerified, statusCodes.BAD_REQUEST, "Please verify your email first.");

        // 2.validate email account is exist or not
        const user = await GlobalUserModel.findOne({ email: otpReference.email });
        appErrorAssert(!user, statusCodes.BAD_REQUEST, "Password is already set.");

        const organizer = await organizerModel.findOne({ email: email });
        appErrorAssert(!organizer, statusCodes.BAD_REQUEST, "Password is already set.");

        // 3.generate Organizer custom id and make payload
        const customID = await generateCustomID();
        const organizerObj = {
            customID,
            email,
            password,
            "steps.first": true,
            otpReferenceID: otpReference?._id,
        }
        // 4.create an account
        let createAccount = await organizerModel.create(organizerObj);
        appErrorAssert(createAccount, statusCodes.BAD_REQUEST, "Not able to create Account");

        // 5.create user role
        const roleObj = {
            userMongoId: createAccount?._id,
            "role.organizer": true,
        }
        const userRole = await userRoleModel.create(roleObj);
        appErrorAssert(userRole, statusCodes.BAD_REQUEST, "Not able to set role.");

        createAccount.userRole = userRole?._id as mongoose.Schema.Types.ObjectId;
        createAccount = await createAccount.save();

        const globalUserObj = {
            userMongoId: createAccount?._id,
            userRole: createAccount?.userRole,
            name: ``,
            email: createAccount?.email,
            isSignedUp: false,
            designationRef: 'Organizer'
        }
        const globalUser = await GlobalUserModel.create(globalUserObj);
        appErrorAssert(globalUser, statusCodes.BAD_REQUEST, "Not able to create platform user.");

        // 6.sent welcome mail
        await sentWelcomeEmail(email);

        // 7.return user
        return { user: createAccount.omitPassword() }
    } catch (error) {
        console.log("error in create organizer service :", error);
        const { message, statusCode } = catchErrorMsgAndStatusCode(error);
        throw new AppError(statusCode, message);
    }
}

type contactType = {
    id: string,
    mobileNumber: string,
    alternativeMobileNumber: string
}
const addOrganizerContactDetails = async ({ id, mobileNumber, alternativeMobileNumber }: contactType) => {
    try {
        // 1.check organizer is exist or not
        const user = await GlobalUserModel.findOne({ userMongoId: id });
        appErrorAssert(user, statusCodes.NOT_FOUND, "User not found.");

        let organizer = await organizerModel.findById(id);
        appErrorAssert(organizer, statusCodes.NOT_FOUND, "Organizer not found.");

        // 2.update contact details and second step 
        organizer.mobileNumber = mobileNumber
        organizer.alternativeMobile = alternativeMobileNumber
        organizer.steps.second = true;
        organizer = await organizer.save();

        // 3.return data
        return {
            organizer: organizer.omitPassword()
        }
    } catch (error) {
        const { message, statusCode } = catchErrorMsgAndStatusCode(error);
        console.log("error in add contact details service :", message);
        throw new AppError(statusCode, message);
    }
}
type payloadType = {
    FirstName: string,
    LastName: string,
    dob: Date,
    gender: string,
    profession: string
}

const addOrganizerProfileDetails = async (id: string, payload: payloadType) => {
    try {
        // 1.check organizer is exist or not
        let user = await GlobalUserModel.findOne({ userMongoId: id });
        appErrorAssert(user, statusCodes.NOT_FOUND, "User not found.");

        let organizer = await organizerModel.findById(id);
        appErrorAssert(organizer, statusCodes.NOT_FOUND, "Organizer not found.");

        // 2.update organizer profile
        organizer.FirstName = payload.FirstName;
        organizer.LastName = payload.LastName;
        organizer.dob = payload.dob;
        organizer.gender = payload.gender;
        organizer.profession = payload.profession;
        organizer.steps.third = true;
        organizer = await organizer.save();

        user.name = `${payload.FirstName} ${payload.LastName}`;
        user = await user.save();

        // 3. return organizer
        return {
            organizer: organizer.omitPassword()
        }
    } catch (error) {
        const { message, statusCode } = catchErrorMsgAndStatusCode(error);
        console.log("error in add profile details service :", message);
        throw new AppError(statusCode, message);
    }
}

type locationPayloadType = {
    address: string,
    pinCode: string,
    city: string,
    state: string,
    country: string,
    userAgent: string,
}

const addOrganizerLocationDetails = async (id: string, payload: locationPayloadType) => {
    try {
        // 1.check the organizer is exist or not
        let user = await GlobalUserModel.findOne({ userMongoId: id });
        appErrorAssert(user, statusCodes.NOT_FOUND, "User not found.");

        let organizer = await organizerModel.findById(id);
        appErrorAssert(organizer, statusCodes.NOT_FOUND, "Organizer Not Found.");

        // 2.update the location of organizer
        const location: locationDocument = {
            address: payload.address,
            pinCode: payload.pinCode,
            city: payload.city,
            state: payload.state,
            country: payload.country,
        }
        organizer.location = location;
        organizer.perDayLimit = 3;
        organizer.isVerified = true;
        organizer.status = "ACTIVE"
        organizer.steps.fourth = true;

        // 3.create a session for organizer
        const sessionPayload = {
            userMongoId: organizer?._id,
            userAgent: payload.userAgent
        }
        let organizerSession = await sessionModel.create(sessionPayload);
        appErrorAssert(organizerSession, statusCodes.BAD_REQUEST, "not able to create organizer session.");

        // 4.generate refresh and access token for organizer
        const refreshToken = signToken(
            { sessionId: organizerSession?._id },
            refreshTokenOptions
        );
        const accessToken = signToken(
            {
                userId: organizer?._id as mongoose.Schema.Types.ObjectId,
                sessionId: organizerSession._id,
            }
        );
        organizer = await organizer.save();

        user.isSignedUp = true;
        user = await user.save();

        // 5.set the tokens into cookies and return data
        return {
            refreshToken,
            accessToken,
            organizer
        }
    } catch (error) {
        const { message, statusCode } = catchErrorMsgAndStatusCode(error);
        console.log("error in add location details service :", message);
        throw new AppError(statusCode, message);
    }
}

const checkIsSignedUp = async (email: string) => {
    try {
        // 1. check the email exist or not
        let user = await GlobalUserModel.findOne({ email: email });
        appErrorAssert(user, statusCodes.NOT_FOUND, "User not found.");

        const organizer = await organizerModel.findOne({ email: email });
        appErrorAssert(organizer, statusCodes.NOT_FOUND, "email is not registered");

        // 2.check signedUp or not 
        appErrorAssert(organizer.steps.fourth, statusCodes.BAD_REQUEST, "Please complete sign up first");

        // return result
        return {
            signedUp: true,
            organizer: organizer.omitPassword()
        }
    } catch (error) {
        const { message, statusCode } = catchErrorMsgAndStatusCode(error);
        console.log("error in check is signedUp service :", message);
        throw new AppError(statusCode, message);
    }
}

const loginService = async (email: string, password: string) => {

    try {
        // 1.check user is exist or not
        const user = await GlobalUserModel.findOne({ email: email }).populate('userMongoId');
        appErrorAssert(user, statusCodes.NOT_FOUND, "email is not registered.");
        appErrorAssert(user?.userMongoId, statusCodes.NOT_FOUND, 'user not found.');

        // 2.compare passwords
        const platformUser = (user?.userMongoId as unknown) as IOrganizer | IStaff | ISubAdmin | IAdmin;
        appErrorAssert(await comparePassword(password, platformUser.password), statusCodes.BAD_REQUEST, "Password is incorrect. Please try again.");

        // 3.generate OTP and referenceID
        const OTP = generateOTP();
        const referenceID = generateUniqueReferenceID();

        // 4.create otp reference
        const data = {
            type: verificationCodeType.LoginVerification,
            email,
            otp_reference: referenceID,
            otp_number: OTP,
            expiresIn: OneMinuteFromNow() // 1 minute from now
        }
        const otpReference = await OtpModel.create(data);
        appErrorAssert(otpReference, statusCodes.BAD_REQUEST, "Not able to add otp reference.");
        console.log("otpReference : ", otpReference);

        // 5.sent login verify otp
        const name = user?.name || email;
        await sentLoginVerifyOTP(email, name, OTP);

        // return referenceID
        return {
            referenceID
        }

    } catch (error) {
        const { message, statusCode } = catchErrorMsgAndStatusCode(error);
        console.log("error in login service :", message);
        throw new AppError(statusCode, message);
    }
}

const loginOtpVerifyService = async (otp: number, referenceID: string, userAgent: string) => {
    try {
        // 1.verify otp reference 
        const otpPayload = {
            type: verificationCodeType.LoginVerification,
            otp_number: otp,
            otp_reference: referenceID
        }
        let otpReference = await OtpModel.findOne(otpPayload);
        appErrorAssert(otpReference, statusCodes.NOT_FOUND, "OTP reference not found");

        const isOtpValid = otpReference?.expiresIn > new Date();
        appErrorAssert(isOtpValid, statusCodes.BAD_REQUEST, "OTP is Expired.");
        otpReference.isVerified = true;
        otpReference = await otpReference.save();

        // 2.check user is signedUp or not 
        let user = await GlobalUserModel.findOne({ email: otpReference?.email }).populate("userMongoId");
        appErrorAssert(user, statusCodes.NOT_FOUND, "User not found.");
        appErrorAssert(user?.userMongoId, statusCodes.UNAUTHORIZED, "User not exist.");
        appErrorAssert(user?.isSignedUp, statusCodes.UNAUTHORIZED, "Completed Your sign up first.");

        const platformUser = (user?.userMongoId as unknown) as IOrganizer | IStaff | ISubAdmin | IAdmin;

        // 3.remove user all sessions and create a new session
        await sessionModel.deleteMany({ userMongoId: platformUser?._id });
        const sessionPayload = {
            userMongoId: platformUser?._id,
            userAgent: userAgent
        }
        let userSession = await sessionModel.create(sessionPayload);
        appErrorAssert(userSession, statusCodes.BAD_REQUEST, "not able to create user session.");

        // 4.generate refresh and access token for user
        const refreshToken = signToken(
            { sessionId: userSession?._id },
            refreshTokenOptions
        );
        const accessToken = signToken(
            {
                userId: platformUser?._id as mongoose.Schema.Types.ObjectId,
                sessionId: userSession._id,
            }
        );
        // 5.return result 
        return {
            user: platformUser,
            accessToken,
            refreshToken
        }
    } catch (error) {
        const { message, statusCode } = catchErrorMsgAndStatusCode(error);
        console.log("error in login otp verify service :", message);
        throw new AppError(statusCode, message);
    }
}

const refreshUserAccessToken = async (refreshToken: string) => {
    try {
        const { payload } = verifyToken(refreshToken, {
            secret: refreshTokenOptions.secret,
        });
        appErrorAssert(payload, statusCodes.UNAUTHORIZED, "Invalid refresh Token");
        const userSession = await sessionModel.findById(payload.sessionId);
        const now = Date.now();
        appErrorAssert(
            userSession && userSession?.expiresAt.getTime() > now,
            statusCodes.UNAUTHORIZED,
            "Session Expired",
        );
        // if the session is going to expires in 24 hours then refresh the session
        if (userSession.expiresAt.getTime() - now < 24 * 60 * 60) {
            userSession.expiresAt = thirtyDaysFromNow();
            await userSession.save();
        }
        // generate refresh token
        const newRefreshToken = signToken({ sessionId: userSession?._id }, refreshTokenOptions);
        // generate accessToken
        const accessToken = signToken(
            {
                userId: userSession?.userMongoId,
                sessionId: userSession._id,
            }
        );
        return {
            accessToken,
            newRefreshToken
        }
    } catch (error) {
        const { message, statusCode } = catchErrorMsgAndStatusCode(error);
        console.log("error in refresh token service :", message);
        throw new AppError(statusCode, message);
    }
}

const sentResetOTPService = async (email: string) => {
    try {
        // 1.validate user exist or not
        const platformUser = await GlobalUserModel.findOne({ email: email });
        appErrorAssert(platformUser, statusCodes.BAD_REQUEST, "User not found.");

        // 2.create otp reference
        const OTP = generateOTP();
        const referenceID = generateUniqueReferenceID();

        const data = {
            type: verificationCodeType.PasswordReset,
            email,
            otp_reference: referenceID,
            otp_number: OTP,
            expiresIn: OneMinuteFromNow() // 1 minute from now
        }
        console.log("reset otp payload : ", data);
        const otpReference = await OtpModel.create(data);
        appErrorAssert(otpReference, statusCodes.BAD_REQUEST, "Not able to add reset otp reference.");
        console.log("otpReference : ", otpReference);

        // 3.sent reset otp to mail
        await sentResetOTPEmail(OTP, email);

        // 4.return otp reference
        return {
            referenceID
        }
    } catch (error) {
        const { message, statusCode } = catchErrorMsgAndStatusCode(error);
        console.log("error in sent reset otp service :", message);
        throw new AppError(statusCode, message);
    }
}

const verifyResetPasswordOTPService = async (otp: number, referenceID: string) => {
    try {
        // 1.check otp reference and verify it
        const otpPayload = {
            type: verificationCodeType.PasswordReset,
            otp_number: otp,
            otp_reference: referenceID
        }
        let otpReference = await OtpModel.findOne(otpPayload);
        appErrorAssert(otpReference, statusCodes.NOT_FOUND, "otp reference not found.");
        const isOtpValid = otpReference.expiresIn > new Date();
        appErrorAssert(isOtpValid, statusCodes.BAD_REQUEST, "OTP is Expired.");
        otpReference.isVerified = true;
        otpReference = await otpReference.save();

        // 2.return otp reference
        return {
            referenceID
        }
    } catch (error) {
        const { message, statusCode } = catchErrorMsgAndStatusCode(error);
        console.log("error in verify reset otp service :", message);
        throw new AppError(statusCode, message);
    }
}

const resetPasswordService = async (password: string, referenceID: string) => {
    try {
        // 1.check reference is exist and verified or not
        const otpPayload = {
            type: verificationCodeType.PasswordReset,
            otp_reference: referenceID
        }
        const otpReference = await OtpModel.findOne(otpPayload);
        appErrorAssert(otpReference, statusCodes.NOT_FOUND, "OTP reference not found.");

        appErrorAssert(otpReference?.isVerified, statusCodes.BAD_REQUEST, "Verify email first.");

        // 2.hash the password 
        // const hash = await hashPassword(password);

        // 3.update password in the user details
        let user = await GlobalUserModel.findOne({ email: otpReference?.email }).populate('userMongoId');
        appErrorAssert(user, statusCodes.NOT_FOUND, 'User not found.');
        let platformUser = (user.userMongoId as unknown) as IOrganizer | IStaff | ISubAdmin | IAdmin;
        platformUser.password = password;
        platformUser.passwordReset = true;
        platformUser.totalNoOfPasswordReset = platformUser.totalNoOfPasswordReset + 1;
        platformUser = await platformUser.save();

        return {
            user: platformUser
        }
    } catch (error) {
        const { message, statusCode } = catchErrorMsgAndStatusCode(error);
        console.log("error in reset password service :", message);
        throw new AppError(statusCode, message);
    }
}

const registerService = {
    sentOtpToEmail,
    verifyEmailOtp,
    createOrganizeAccount,
    addOrganizerContactDetails,
    addOrganizerProfileDetails,
    addOrganizerLocationDetails,
    checkIsSignedUp,
    loginService,
    loginOtpVerifyService,
    refreshUserAccessToken,
    sentResetOTPService,
    verifyResetPasswordOTPService,
    resetPasswordService
}

export default registerService;