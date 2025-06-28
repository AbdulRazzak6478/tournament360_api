import mongoose, { Schema, model, Document } from 'mongoose';

export interface IReferee extends Document {
    tournamentID: mongoose.Schema.Types.ObjectId;
    name: string;
    email: string,
    mobileNumber: string;
    totalExperience: string,
    createdAt: Date;
    updatedAt: Date;
}

const refereeSchema = new Schema<IReferee>({
    tournamentID: {
        type: String,
        required: true,
        ref: 'Tournament',
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        default: "",
    },
    mobileNumber: {
        type: String,
        required: true,
        default: "",
    },
    totalExperience: {
        type: String,
        required: true,
    },
});

const refereeModel = model<IReferee>('referee', refereeSchema);

export default refereeModel;