import mongoose, { Schema, model, Document } from 'mongoose';

export interface IVenue extends Document {
    tournamentID: mongoose.Schema.Types.ObjectId;
    name: string;
    addressLine1: string,
    addressLine2: string;
    city: string,
    state: string,
    createdAt: Date;
    updatedAt: Date;
}

const venueSchema = new Schema<IVenue>({
    tournamentID: {
        type: String,
        required: true,
        ref:'Tournament',
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
    },
    addressLine1: {
        type: String,
        default: "",
        required: true,
    },
    addressLine2: {
        type: String,
        required: true,
        default: "",
    },
    city: {
        type: String,
        required: true,
        default: "",
    },
    state: {
        type: String,
        required: true,
        default: "",
    },

});

const venueModel = model<IVenue>('sponsor', venueSchema);

export default venueModel;