import { Schema, model, Document } from 'mongoose';

interface ISport extends Document {
    sportID: string;
    name: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

const SportSchema: Schema = new Schema<ISport>({
    sportID: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" }
}, {
    timestamps: true
});

SportSchema.index({ sportID: 1, name: 1 }, { unique: true }); // Ensures uniqueness on sportID & name
SportSchema.index({ name: 1 }); // If you often search by name
SportSchema.index({ createdAt: -1 }); // Sort by newest records


const Sport = model<ISport>('Sport', SportSchema);

export default Sport;