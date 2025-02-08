// import { thirtyDaysFromNow } from '../utils/dateHandlers';
import mongoose, { Document } from "mongoose";

export interface SessionDocument extends Document {
    userId: mongoose.Types.ObjectId,
    userAgent?: string,
    createdAt: Date,
    expiresAt: Date
}

const sessionSchema = new mongoose.Schema<SessionDocument>({
    userId: { type: mongoose.Schema.Types.ObjectId, index: true, ref: "Organizer" },
    userAgent: { type: String },
    createdAt: { type: Date, required: true, default: Date.now() },
    // expiresAt: { type: Date, default: thirtyDaysFromNow() }
    expiresAt: { type: Date, default: null }
});

const sessionModel = mongoose.model<SessionDocument>("session", sessionSchema);

export default sessionModel;