import mongoose, { Document, Model } from "mongoose";
import { enums } from "../constants/verification-codes.constant.js";



export interface OTPReferenceDocument extends Document {
    type: string;
    email: string;
    otp_reference: string;
    otp_number: number;
    expiresIn: Date;
    isVerified: boolean;
    createdAt: Date;
    updated: Date;
}

const OTPReferenceSchema = new mongoose.Schema<OTPReferenceDocument>({
    type: {
        type: String,
        required: true,
        enum: enums
    },
    email: {
        type: String,
        required: true
    },
    otp_reference: {
        type: String,
        required: true
    },
    otp_number: {
        type: Number,
        required: true
    },
    expiresIn: {
        type: Date,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });


const OtpModel: Model<OTPReferenceDocument> = mongoose.model<OTPReferenceDocument>("otp", OTPReferenceSchema);

export default OtpModel;