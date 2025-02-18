import bcrypt from 'bcryptjs';
import mongoose, { Document, Model } from 'mongoose';


export interface SubOrdinateDocument extends Document {
    organizerId: mongoose.Schema.Types.ObjectId;
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
    omitPassword(): Omit<SubOrdinateDocument, "password">;
    createdAt: Date;
    updated: Date;
}
const SubOrdinateSchema = new mongoose.Schema<SubOrdinateDocument>({
    organizerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Organizer', index: true },
    name: { type: String, required: true, index: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    designation: { type: String, required: true },
    userRole: { type: mongoose.Schema.Types.ObjectId, ref: 'user_role', index: true, default: null },
    gender: { type: String, required: true },
    dob: { type: Date, required: true },
    status: { type: String, required: true, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], index: true },
    mobileNumber: { type: String, required: true, index: true },
    totalNoOfPasswordReset: { type: Number, default: 0 },
    passwordReset: { type: Boolean, default: false },
}, { timestamps: true });

SubOrdinateSchema.index({ email: 1 });
SubOrdinateSchema.index({ name: 1 });
SubOrdinateSchema.index({ status: 1 });
SubOrdinateSchema.index({ mobileNumber: 1 });
SubOrdinateSchema.index({ userRole: 1 });
SubOrdinateSchema.index({ organizer: 1 });

SubOrdinateSchema.pre<SubOrdinateDocument>("save", async function (next) {
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
SubOrdinateSchema.methods.comparePassword = async function (
    password: string
): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
};

SubOrdinateSchema.methods.omitPassword = function () {
    const user = this.toObject();
    delete user.password;
    return user;
}

const subordinateModel: Model<SubOrdinateDocument> = mongoose.model<SubOrdinateDocument>('SubOrdinate', SubOrdinateSchema);

export default subordinateModel;