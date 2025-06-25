import mongoose from "mongoose";
import statusCodes from "../constants/statusCodes.js";
import GlobalUserModel from "../models/globalUsers.model.js";
import organizerModel from "../models/Organizer.model.js";
import userRoleModel from "../models/userRole.model.js";
import appErrorAssert from "../utils/appAssert.js";
import AppError from "../utils/appError.js";
import catchErrorMsgAndStatusCode from "../utils/catchError.js"
import staffModel from "../models/staff.model.js";


type payloadType = {
    name: string,
    email: string,
    password: string,
    designation: string,
    gender: string,
    dob: string,
    mobileNumber: string
}
const createStaffService = async (organizerId: string, data: payloadType) => {
    try {
        // 1. check user is exist already or not

        const organizer = await organizerModel.findById(organizerId);
        appErrorAssert(organizer, statusCodes.NOT_FOUND, "Organizer not found.");

        let user = await GlobalUserModel.findOne({ email: data?.email });
        appErrorAssert(!user, statusCodes.BAD_REQUEST, "email is already exist.");

        // 2. create organizer subordinate 
        const payload = {
            organizerId,
            ...data,
            status: 'ACTIVE'
        }
        let staff = await staffModel.create(payload);
        appErrorAssert(staff, statusCodes.BAD_REQUEST, "Not able to create subordinate.");
        // 3. create user role
        const rolePayload = {
            userMongoId: staff?._id,
            "role.staff.type": true,
        }
        const userRole = await userRoleModel.create(rolePayload);
        appErrorAssert(userRole, statusCodes.BAD_REQUEST, "not able to create user role.");

        staff.userRole = userRole?._id as mongoose.Schema.Types.ObjectId;
        staff = await staff.save();

        // 4. create platform user instance
        const globalUserPayload = {
            userMongoId: staff?._id,
            name: staff?.name,
            email: staff?.email,
            userRole: userRole?._id,
            isSignedUp: true,
            designationRef: 'staff'
        }
        const globalUser = await GlobalUserModel.create(globalUserPayload);
        appErrorAssert(globalUser, statusCodes.BAD_REQUEST, "not able to create a user.");

        return {
            staff: staff.omitPassword()
        }
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        throw new AppError(statusCode, message);
    }
}

const staffService = {
    createStaffService
}

export default staffService;