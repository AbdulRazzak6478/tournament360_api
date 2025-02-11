import  bcrypt  from 'bcryptjs';
import mongoose, { Schema, Document, model } from 'mongoose';

// Define the Admin interface
export interface IAdmin extends Document {
    name: string;
    password: string;
    email: string;
    role: mongoose.Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// Define the Admin schema
const AdminSchema: Schema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: mongoose.Schema.Types.ObjectId, required: true },
}, { timestamps: true });

AdminSchema.pre<IAdmin>("save", async function (next) {
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
AdminSchema.methods.comparePassword = async function (
    password: string
): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
};

AdminSchema.methods.omitPassword = function () {
    const user = this.toObject();
    delete user.password;
    return user;
}

// Create and export the Admin model
const AdminModel = model<IAdmin>('Admin', AdminSchema);
export default AdminModel;