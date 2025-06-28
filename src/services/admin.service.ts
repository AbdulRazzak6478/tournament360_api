import mongoose from "mongoose";
import statusCodes from "../constants/status-codes.constant.js";
import AdminModel from "../models/admin.model.js";
import userRoleModel from "../models/user-role.model.js";
import appErrorAssert from "../utils/app-assert.util.js";
import AppError from "../utils/app-error.util.js";
import catchErrorMsgAndStatusCode from "../utils/catch-error.util.js"
import GlobalUserModel from "../models/global-users.model.js";



type createPayload = {
    name: string,
    password: string,
    email: string
}

const createAdminAccount = async (data: createPayload) => {
    try {


        // 1. check if the user is exist or not
        const isUserExist = await GlobalUserModel.findOne({ email: data.email });
        appErrorAssert(!isUserExist, statusCodes.BAD_REQUEST, "email is already exist.");

        const isAdminExist = await AdminModel.findOne({ email: data.email });
        appErrorAssert(!isAdminExist, statusCodes.BAD_REQUEST, "email is already exist.");

        // 2. create a account
        const payload = {
            name: data.name,
            password: data.password,
            email: data.email
        }
        const admin = await AdminModel.create(payload);
        appErrorAssert(admin, statusCodes.BAD_REQUEST, 'not able to create admin account');

        // 3. create user Role
        const rolePayload = {
            userMongoId: admin?._id,
            "role.admin": true
        }
        const userRole = await userRoleModel.create(rolePayload);
        appErrorAssert(userRole, statusCodes.BAD_REQUEST, 'Not able to create user role.');

        admin.role = userRole?._id as mongoose.Schema.Types.ObjectId;
        await admin.save();

        // 4. create global user instance
        const globalUserPayload = {
            userMongoId: admin?._id,
            userRole: userRole?._id,
            name: admin?.name,
            email: admin?.email,
            isSignedUp: true,
            designationRef: 'Admin'
        }
        const globalUser = await GlobalUserModel.create(globalUserPayload);
        appErrorAssert(globalUser, statusCodes.BAD_REQUEST, 'Not able to create User.');

        // 5. return admin details
        return {
            admin: admin.omitPassword()
        }

    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        console.log("Error in create admin service : ", message);
        throw new AppError(statusCode, message);
    }
}


const adminService = {
    createAdminAccount
}

export default adminService;