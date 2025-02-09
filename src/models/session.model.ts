import mongoose, { Document } from "mongoose";
import { thirtyDaysFromNow } from "../utils/dateHandlers.js";

export interface SessionDocument extends Document {
    userMongoId: mongoose.Schema.Types.ObjectId,
    userAgent?: string,
    createdAt: Date,
    expiresAt: Date
}

const sessionSchema = new mongoose.Schema<SessionDocument>({
    userMongoId: { type: mongoose.Schema.Types.ObjectId, index: true, ref: "Organizer" },
    userAgent: { type: String, default:""},
    createdAt: { type: Date, default: new Date() },
    expiresAt: { type: Date, default: thirtyDaysFromNow() }
    // expiresAt: { type: Date, default: null }
});

const sessionModel = mongoose.model<SessionDocument>("session", sessionSchema);

export default sessionModel;