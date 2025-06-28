import mongoose from "mongoose";
import statusCodes from "../constants/status-codes.constant.js";
import GlobalUserModel from "../models/global-users.model.js";
import userRoleModel from "../models/user-role.model.js";
import appErrorAssert from "../utils/app-assert.util.js";
import AppError from "../utils/app-error.util.js";
import catchErrorMsgAndStatusCode from "../utils/catch-error.util.js"
import SubAdminModel from "../models/subadmin.model.js";


type payloadType = {
    name: string,
    email: string,
    password: string,
    designation: string,
    gender: string,
    dob: string,
    mobileNumber: string,
    permissions: string[]
}
const createSubAdminAccount = async (data: payloadType) => {
    try {
        // 1. check user is exist already or not

        let user = await GlobalUserModel.findOne({ email: data?.email });
        appErrorAssert(!user, statusCodes.BAD_REQUEST, "email is already exist.");

        // 2. create organizer subordinate 
        const payload = {
            ...data,
            status: 'ACTIVE'
        }
        let subAdmin = await SubAdminModel.create(payload);
        appErrorAssert(subAdmin, statusCodes.BAD_REQUEST, "Not able to create sub admin.");
        // 3. create user role
        const rolePayload = {
            userMongoId: subAdmin?._id,
            "role.subAdmin": {
                type: true,
                permissions: data?.permissions
            },
        }
        const userRole = await userRoleModel.create(rolePayload);
        appErrorAssert(userRole, statusCodes.BAD_REQUEST, "not able to create user role.");

        subAdmin.userRole = userRole?._id as mongoose.Schema.Types.ObjectId;
        subAdmin = await subAdmin.save();

        // 4. create platform user instance
        const globalUserPayload = {
            userMongoId: subAdmin?._id,
            name: subAdmin?.name,
            email: subAdmin?.email,
            userRole: userRole?._id,
            isSignedUp: true,
            designationRef: 'SubAdmin'
        }
        const globalUser = await GlobalUserModel.create(globalUserPayload);
        appErrorAssert(globalUser, statusCodes.BAD_REQUEST, "not able to create a user.");

        return {
            subAdmin: subAdmin.omitPassword()
        }
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        throw new AppError(statusCode, message);
    }
}

const subAdminService = {
    createSubAdminAccount
}

export default subAdminService;