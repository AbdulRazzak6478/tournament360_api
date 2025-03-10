import mongoose, { Document, model, Schema } from "mongoose";


export interface ITeam extends Document {
    tournamentID: mongoose.Schema.Types.ObjectId;
    sportID: mongoose.Schema.Types.ObjectId;
    name: string;
    sportName: string;
    participantNumber: number;
    captain: mongoose.Schema.Types.ObjectId;
    members: mongoose.Schema.Types.ObjectId[];
    players: mongoose.Schema.Types.ObjectId[];
    status: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const teamSchema = new Schema<ITeam>({
    tournamentID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Tournament',
    },
    sportID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Sport',
    },
    name: {
        type: String,
        required: true,
    },
    sportName: {
        type: String,
        required: true,
    },
    participantNumber: {
        type: Number,
        required: true,
    },
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'player',
        default: null
    },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'player',
            default: null
        }
    ],
    players: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'player',
            default: null
        }
    ],
    status: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

const teamModel = model<ITeam>('team', teamSchema);

export default teamModel;

