import { ValidationError } from "yup";
import catchAsync from "../utils/catch-async.util.js";
import catchErrorMsgAndStatusCode from "../utils/catch-error.util.js";
import { failed_response, success_response } from "../utils/response.util.js";
import statusCodes from "../constants/status-codes.constant.js";
import { createSubordinateSchema } from "../utils/yup-validations.util.js";
import mongoose from "mongoose";
import staffService from "../services/staff.service.js";



const createStaff = catchAsync(async (req, res) => {
    const { organizerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(organizerId)) {
        return res
            .status(statusCodes.BAD_REQUEST)
            .json(
                failed_response(
                    statusCodes.BAD_REQUEST,
                    "Invalid organizerId",
                    { message: "organizerId must be a valid MongoDB ObjectId" },
                    false
                )
            );
    }
    try {
        // 1. validate sub ordinate data , request data
        try {
            await createSubordinateSchema.validate(
                { ...req.body, userAgent: req.headers["user-agent"] },
                { abortEarly: false }
            );
        } catch (error) {
            if (error instanceof ValidationError) {
                console.log(
                    "Yup validation error in add organizer subordinate  : ",
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
        const { name, email, password, designation, gender, dob, mobileNumber } = req.body;
        const payload = {
            name,
            email,
            password,
            designation,
            gender,
            dob,
            mobileNumber
        }
        // 3. call the create subordinate service
        const response = await staffService.createStaffService(organizerId, payload);
        // 4. return the created subordinate payload
        return res.status(statusCodes.CREATED).json(
            success_response(
                statusCodes.CREATED,
                "Staff Created Successfully.",
                response,
                true
            )
        );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res.status(statusCode).json(
            failed_response(
                statusCode,
                "failed to create Staff",
                { message },
                false
            )
        );
    }
});

const staffController = {
    createStaff
}

export default staffController;