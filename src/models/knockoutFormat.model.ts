import mongoose, { Schema, model, Document } from 'mongoose';
import { fixingTypeEnums, gameTypeRefs, participantRefs } from '../constants/modelRefs.js';

export interface IKnockout extends Document {
    tournamentID: mongoose.Schema.Types.ObjectId;
    formatName: string;
    fixingType: string;
    gameType: string;
    totalRounds: number;
    roundNames: string[];
    // totalTeams: number;
    totalParticipants: number;
    rounds: mongoose.Schema.Types.ObjectId[];
    // teams: mongoose.Schema.Types.ObjectId[];
    participants: mongoose.Schema.Types.ObjectId[];
    players: mongoose.Schema.Types.ObjectId[];
    participantRef: string;
    createdAt: Date;
    updatedAt: Date;
}

const KnockoutSchema = new Schema<IKnockout>({
    tournamentID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Tournament",
        index: true
    },
    formatName: {
        type: String,
        default: 'knockout'
    },
    fixingType: {
        type: String,
        enum: fixingTypeEnums,
        required: true,
    },
    gameType: {
        type: String,
        enum: gameTypeRefs,
        required: true
    },
    totalRounds: {
        type: Number,
        default: 0
    },
    roundNames: [
        {
            type: String,
            required: true
        }
    ],
    totalParticipants: {
        type: Number,
        required: true
    },
    rounds: [
        {
            type: mongoose.Schema.Types.ObjectId, ref: "round", default: null
        }
    ],
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId, refPath: "participantRef", default: null

        }
    ],
    players: [
        {
            type: mongoose.Schema.Types.ObjectId, ref: "player", default: null

        }
    ],
    participantRef: {
        type: String,
        enum: participantRefs
    }
});

const KnockoutModel = model<IKnockout>('knockout', KnockoutSchema);

export default KnockoutModel;