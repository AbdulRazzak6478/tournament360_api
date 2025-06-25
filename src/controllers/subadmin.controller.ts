import { ValidationError } from "yup";
import catchAsync from "../utils/catchAsync.js";
import catchErrorMsgAndStatusCode from "../utils/catchError.js";
import { failed_response, success_response } from "../utils/response.js";
import statusCodes from "../constants/statusCodes.js";
import { createSubAdminSchema } from "../utils/yupValidations.js";
import subAdminService from "../service/subAdmin.service.js";



const createSuAdmin = catchAsync(async (req, res) => {
    try {
        // 1. validate sub admin data , request data
        try {
            await createSubAdminSchema.validate(
                { ...req.body},
                { abortEarly: false }
            );
        } catch (error) {
            if (error instanceof ValidationError) {
                console.log(
                    "Yup validation error in add sub admin  : ",
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

        // 2. make a payload for subordinate
        const { name, email, password, designation, gender, dob, mobileNumber, permissions } = req.body;
        const payload = {
            name,
            email,
            password,
            designation,
            gender,
            dob,
            mobileNumber,
            permissions
        }
        // 3. call the create subordinate service
        const response = await subAdminService.createSubAdminAccount(payload);
        // 4. return the created subordinate payload
        return res.status(statusCodes.CREATED).json(
            success_response(
                statusCodes.CREATED,
                "sub Admin is created successfully.",
                response,
                true
            )
        );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res.status(statusCode).json(
            failed_response(
                statusCode,
                "failed to create sub admin",
                { message },
                false
            )
        );
    }
});

const subAdminController = {
    createSuAdmin
}

export default subAdminController;