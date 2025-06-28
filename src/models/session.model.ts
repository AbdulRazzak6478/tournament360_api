import mongoose, { Document } from "mongoose";
import { thirtyDaysFromNow } from "../utils/date-handlers.util.js";
import { userRefs } from "../constants/model-refs.constant.js";

export interface ISession extends Document {
    _id: mongoose.Schema.Types.ObjectId,
    userMongoId: mongoose.Schema.Types.ObjectId,
    userAgent?: string,
    createdAt: Date,
    expiresAt: Date,
    userRef: string
}

const sessionSchema = new mongoose.Schema<ISession>({
    userMongoId: { type: mongoose.Schema.Types.ObjectId, index: true, refPath: "userRef" },
    userAgent: { type: String, default: "" },
    createdAt: { type: Date, default: new Date() },
    expiresAt: { type: Date, default: thirtyDaysFromNow() },
    userRef: { type: String, enum: userRefs }
    // expiresAt: { type: Date, default: null }
});

const sessionModel = mongoose.model<ISession>("session", sessionSchema);

export default sessionModel;