import { ValidationError } from "yup";
import statusCodes from "../constants/status-codes.constant.js";
import catchAsync from "../utils/catch-async.util.js";
import catchErrorMsgAndStatusCode from "../utils/catch-error.util.js";
import { failed_response, success_response } from "../utils/response.util.js";
import { createAdminSchema } from "../utils/yup-validations.util.js";
import adminService from "../services/admin.service.js";





const createAdmin = catchAsync(async (req, res) => {
    try {
        // 1. validate sub ordinate data , request data
        try {
            await createAdminSchema.validate(
                { ...req.body },
                { abortEarly: false }
            );
        } catch (error) {
            if (error instanceof ValidationError) {
                console.log(
                    "Yup validation error in create admin  : ",
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
        // 2. form a payload and call admin service
        const { name, password, email } = req.body;
        const payload = {
            name,
            password,
            email
        }
        const response = await adminService.createAdminAccount(payload)
        // 3. return response
        return res.status(statusCodes.CREATED).json(
            success_response(
                statusCodes.CREATED,
                "admin is created successfully.",
                response,
                true
            )
        );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        console.log("Error in create admin account controller : ", message);
        return res.status(statusCode).json(
            failed_response(
                statusCode,
                "failed to create admin",
                { message },
                false
            )
        );
    }
});

const adminController = {
    createAdmin
}

export default adminController;