import yup from "yup";

const emailValidate = yup.string().email('Invalid email format').required('Email is required');

const mobileNumberValidate = yup.string().required("mobileNumber is required").matches(/^\+[1-9]\d{1,14}$/, "Enter a valid mobileNumber.");

const dobValidate =  yup.date().required("dob is required").max(new Date(new Date().setFullYear(new Date().getFullYear() - 18)), "You must be at least 18 years old.").typeError("Invalid date format");

const ObjectIdSchema = yup.string().required("id is required").matches(/^[0-9a-fA-F]{24}$/, "pass a valid id as ObjectId.");

const emailOtpVerifySchema = yup.object({
    otp_number: yup.number().required("otp_number is required").min(6, "OTP must be 6 digits Only."),
    otp_reference: yup.string().required("otp_reference is required"),
    userAgent : yup.string().required("userAgent is missing.")
});

const createOrganizerSchema = yup.object({
    referenceID: yup.string().required("referenceID is required"),
    email: yup.string().email().required("email is required"),
    password: yup.string().required("password is required").min(8, "password must contain minimum 8 characters"),
    userAgent: yup.string().optional()
});

const addContactDetailsSchema = yup.object({
    id: ObjectIdSchema,
    mobileNumber: yup.string().required("mobileNumber is required").matches(/^\+[1-9]\d{1,14}$/, "Enter a valid mobileNumber."),
    alternativeMobileNumber: yup.string().required("alternativeMobileNumber is required").matches(/^\+[1-9]\d{1,14}$/, "Enter a valid alternativeMobileNumber."),
});

const addProfileDetailsSchema = yup.object({
    id: ObjectIdSchema,
    firstName: yup.string().required('firstName is required').min(1, "firstName must be at least 1 character"),
    lastName: yup.string().required('lastName is required').min(1, "lastName must be at least 1 character"),
    gender: yup.string().required('gender is required'),
    dob: dobValidate,
    profession: yup.string().required("profession is required.")
});

const addLocationDetailsSchema = yup.object({
    id: ObjectIdSchema,
    address: yup.string().required('address is required').min(3, "address must be at least 3 characters"),
    pinCode: yup.string().required('pinCode is required').min(6, "pinCode must be at least 6 characters").max(10,"pinCode must be not more then 10 characters."),
    city: yup.string().required("city is required.").min(3,"city must be at least 3 characters."),
    state: yup.string().required("state is required.").min(3,"state must be at least 3 characters."),
    country: yup.string().required("country is required.").min(3,"country must be at least 3 characters."),
    userAgent: yup.string().required("userAgent is missing.")
});

const loginSchema = yup.object({
    email:emailValidate,
    password:yup.string().required("password is required.").min(8,'password must be at least 8 characters.'),
});
const resetPasswordSchema = yup.object({
    referenceID: yup.string().required("referenceID is required"),
    password:yup.string().required("password is required.").min(8,'password must be at least 8 characters.'),
});


const createSubordinateSchema = yup.object({
    name: yup.string().required("name is required.").min(3,"minimum 3 characters required."),
    email:emailValidate,
    password: yup.string().required('password is required.').min(8,'password must be at least 8 characters.'),
    designation :yup.string().required("designation is required."),
    gender: yup.string().required("gender is required."),
    dob :dobValidate,
    mobileNumber : mobileNumberValidate,
    userAgent: yup.string().required("userAgent is missing.")
});
const createSubAdminSchema = yup.object({
    name: yup.string().required("name is required.").min(3, "minimum 3 characters required."),
    email: emailValidate,
    password: yup.string().required('password is required.').min(8, 'password must be at least 8 characters.'),
    designation: yup.string().required("designation is required."),
    gender: yup.string().required("gender is required."),
    dob: dobValidate,
    mobileNumber: mobileNumberValidate,
    permissions: yup.array().of(yup.string().required("permission is required")).required("permissions are required")
});

const createAdminSchema = yup.object({
    name : yup.string().required("name is required."),
    password : yup.string().required('password is required.').min(8,'password must be at least 8 characters.'),
    email : emailValidate
});

export {
    emailValidate,
    emailOtpVerifySchema,
    createOrganizerSchema,
    addContactDetailsSchema,
    addProfileDetailsSchema,
    addLocationDetailsSchema,
    loginSchema,
    resetPasswordSchema,
    createSubordinateSchema,
    createSubAdminSchema,
    createAdminSchema
}