import { refreshTokenOptions, signToken } from './../utils/jwt.js';
import mongoose from "mongoose";
import statusCodes from "../constants/statusCodes.js";
import verificationCodeType from "../constants/verificationCode.js";
import organizerModel, { locationDocument } from "../models/Organizer.model.js";
import OtpModel from "../models/otp-model.js";
import userRoleModel from "../models/userRole.js";
import appErrorAssert from "../utils/appAssert.js";
import AppError from "../utils/appError.js";
import catchErrorMsgAndStatusCode from "../utils/catchError.js";
import { OneMinuteFromNow } from "../utils/dateHandlers.js";
import { sendOtpVerifyEmail, sentWelcomeEmail } from "../utils/sentEmail.js";
import { generateCustomID, generateOTP, generateUniqueReferenceID } from "../utils/uniqueIDs.js";
import sessionModel from "../models/session.model.js";

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
        console.log("error in sent otp verify email service :", error);
        const { message, statusCode } = catchErrorMsgAndStatusCode(error);
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
        let organizer = await organizerModel.findById(id);
        appErrorAssert(organizer, statusCodes.NOT_FOUND, "Organizer Not Found.");

        // 2.update the location of organizer
        const location:locationDocument = {
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
            userMongoId : organizer?._id,
            userAgent : payload.userAgent
        }
        let organizerSession = await sessionModel.create(sessionPayload);
        appErrorAssert(organizerSession,statusCodes.BAD_REQUEST,"not able to create organizer session.");
        
        // 4.generate refresh and access token for organizer
        const refreshToken = signToken(
            { sessionId : organizerSession?._id},
            refreshTokenOptions
        );
        const accessToken = signToken(
            {
                userId : organizer?._id as mongoose.Schema.Types.ObjectId,
                sessionId : organizerSession._id,
            }
        );
        organizer = await organizer.save();

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
const registerService = {
    sentOtpToEmail,
    verifyEmailOtp,
    createOrganizeAccount,
    addOrganizerContactDetails,
    addOrganizerProfileDetails,
    addOrganizerLocationDetails
}

export default registerService;