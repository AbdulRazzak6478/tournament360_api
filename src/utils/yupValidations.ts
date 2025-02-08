import yup from "yup";

const emailValidate = yup.string().email('Invalid email format').required('Email is required');

const emailOtpVerifySchema = yup.object({
    otp_number : yup.number().required("otp_number is required").min(6,"OTP must be 6 digits Only."),
    otp_reference : yup.string().required("otp_reference is required")
});

const createOrganizerSchema = yup.object({
    referenceID : yup.string().required("referenceID is required"),
    email : yup.string().email().required("email is required"),
    password:yup.string().required("password is required").min(8,"password must contain minimum 8 characters"),
    userAgent: yup.string().optional()
});

const addContactDetailsSchema = yup.object({
    id: yup.string().required("id is required").matches(/^[0-9a-fA-F]{24}$/, "pass a valid id as ObjectId."),
    mobileNumber: yup.string().required("mobileNumber is required").matches(/^\+[1-9]\d{1,14}$/, "Enter a valid mobileNumber."),
    alternativeMobileNumber: yup.string().required("alternativeMobileNumber is required").matches(/^\+[1-9]\d{1,14}$/, "Enter a valid alternativeMobileNumber."),
});

export {
    emailValidate,
    emailOtpVerifySchema,
    createOrganizerSchema,
    addContactDetailsSchema
}