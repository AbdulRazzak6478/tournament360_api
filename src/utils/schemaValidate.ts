import { Schema, ValidationError } from "yup";
import { Response } from "express";
import statusCodes from "../constants/statusCodes.js";
import { failed_response } from "./response.js";

export const schemaValidation = async (
    schema: Schema<object | string>,
    data: object | string | undefined,
    res: Response
): Promise<boolean> => {
    let isInValid = true;
    try {
        const result = await schema.validate(data, { abortEarly: false });
        isInValid = false;
        console.log("Validation Check : ", isInValid, result);
        return isInValid;
    } catch (error) {
        if (error instanceof ValidationError) {
            console.log("Yup validation error:", error);
            res
                .status(statusCodes.BAD_REQUEST)
                .json(
                    failed_response(
                        statusCodes.BAD_REQUEST,
                        "Yup validation failed",
                        {
                            status: "Please check the highlighted fields.",
                            message: error?.errors?.[0] || error?.message,
                            errors: error?.errors || []
                        },
                        false
                    )
                );
        }
        return isInValid;
    }
};
