import  bcrypt  from 'bcryptjs';
import mongoose, { Schema, model, Document } from 'mongoose';
import { Model } from 'mongoose';

export interface SubAdminDocument extends Document {
    name: string;
    password: string;
    email: string;
    designation: string;
    userRole: mongoose.Schema.Types.ObjectId;
    gender: string;
    dob: Date;
    status: string;
    mobileNumber: string;
    totalNoOfPasswordReset: number;
    passwordReset: boolean;
    comparePassword(val: string): Promise<boolean>;
    omitPassword(): Omit<SubAdminDocument, "password">;
    createdAt: Date;
    updated: Date;
}
const subAdminSchema = new Schema<SubAdminDocument>({
    name: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    designation: { type: String, required: true },
    userRole: { type: mongoose.Schema.Types.ObjectId, ref: 'user_role' },
    gender: { type: String, required: true },
    dob: { type: Date, required: true },
    status: { type: String, default : 'ACTIVE',enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
    mobileNumber: { type: String, required: true },
    totalNoOfPasswordReset: { type: Number, default: 0 },
    passwordReset: { type: Boolean, default: false },
},{timestamps: true});


subAdminSchema.pre<SubAdminDocument>("save", async function (next) {
    console.log("user modified check : ", this.isModified("password"));

    // No need to assign 'this' to a local variable
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt); // Directly use 'this'
        next();
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.log("Error in saving user hash password : ", error.message);
            next(error as mongoose.CallbackError);
        } else {
            next(new Error("Unknown error during password hashing"));
        }
    }
});


// Method to compare password for login purposes
subAdminSchema.methods.comparePassword = async function (
    password: string
): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
};

subAdminSchema.methods.omitPassword = function () {
    const user = this.toObject();
    delete user.password;
    return user;
}

const SubAdminModel: Model<SubAdminDocument> = model<SubAdminDocument>('SubAdmin', subAdminSchema);

export default SubAdminModel;