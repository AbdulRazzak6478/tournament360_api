import mongoose, { Document, Model, Schema } from "mongoose";
import { userRefs } from "../constants/model-refs.constant.js";


export interface IGlobalUser extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    userMongoId: mongoose.Schema.Types.ObjectId;
    userRole: mongoose.Schema.Types.ObjectId;
    name: string;
    email: string;
    isSignedUp: boolean;
    designationRef: string;
    createdAt: Date;
    updatedAt: Date;
}

const globalUserSchema = new Schema<IGlobalUser>({
    userMongoId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "designationRef",
        required: true,
        index: true
    },
    userRole: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "user_role",
        default: null
    },
    name: {
        type: String,
        default: "",
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    isSignedUp: {
        type: Boolean,
        default: false
    },
    designationRef: {
        type: String,
        enum: userRefs,
        required: true
    }
}, { timestamps: true });


const GlobalUserModel: Model<IGlobalUser> = mongoose.model<IGlobalUser>("global_user", globalUserSchema);

export default GlobalUserModel;