import mongoose from "mongoose";
import statusCodes from "../constants/statusCodes.js";
import GlobalUserModel from "../models/globalUsers.model.js";
import userRoleModel from "../models/userRole.model.js";
import appErrorAssert from "../utils/appAssert.js";
import AppError from "../utils/appError.js";
import catchErrorMsgAndStatusCode from "../utils/catchError.js"
import SubAdminModel from "../models/subadmin.model.js";


type payloadType = {
    name: string,
    email: string,
    password: string,
    designation: string,
    gender: string,
    dob: string,
    mobileNumber: string,
    permissions : string[]
}
const createSubAdminAccount = async (data: payloadType) => {
    try {
        // 1. check user is exist already or not
   
        let user = await GlobalUserModel.findOne({email : data?.email});
        appErrorAssert(!user,statusCodes.BAD_REQUEST,"email is already exist.");

        // 2. create organizer subordinate 
        const payload = {
            ...data,
            status : 'ACTIVE'
        }
        let subAdmin = await SubAdminModel.create(payload);
        appErrorAssert(subAdmin,statusCodes.BAD_REQUEST,"Not able to create sub admin.");
        // 3. create user role
        const rolePayload = {
            userMongoId : subAdmin?._id,
            "role.subAdmin" : {
                type : true,
                permissions : data?.permissions
            },
        }
        const userRole = await userRoleModel.create(rolePayload);
        appErrorAssert(userRole,statusCodes.BAD_REQUEST,"not able to create user role.");

        subAdmin.userRole = userRole?._id  as mongoose.Schema.Types.ObjectId;
        subAdmin = await subAdmin.save();

        // 4. create platform user instance
        const globalUserPayload = {
            userMongoId : subAdmin?._id,
            name : subAdmin?.name,
            email:subAdmin?.email,
            userRole : userRole?._id,
            isSignedUp: true,
            designationRef : 'SubAdmin'
        }
        const globalUser = await GlobalUserModel.create(globalUserPayload);
        appErrorAssert(globalUser,statusCodes.BAD_REQUEST,"not able to create a user.");

        return {
            subAdmin : subAdmin.omitPassword()
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