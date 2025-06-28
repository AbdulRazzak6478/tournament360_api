import mongoose, { model, Schema } from "mongoose";
import { IMatch } from "./match.model.js";
import { fixingTypeEnums, formatNames, formatRefs, gameTypeRefs, participantRefs } from "../constants/model-refs.constant.js";


export interface IRound extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    tournamentID: mongoose.Schema.Types.ObjectId;
    formatTypeID: mongoose.Schema.Types.ObjectId;
    participantsRef: string;
    formatRef: string;
    formatName: string;
    fixingType: string;
    gameType: string;
    roundNumber: number;
    roundName: string;
    bracket: string;
    participants: mongoose.Schema.Types.ObjectId[];
    matches: mongoose.Schema.Types.ObjectId[] | IMatch[];
    winners: mongoose.Schema.Types.ObjectId[];
    isCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const roundSchema: Schema<IRound> = new Schema<IRound>({
    tournamentID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tournament",
        required: true,
    },
    formatTypeID: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'formatRef',
        required: true,
    },
    formatRef: {
        type: String,
        enum: formatRefs,
        required: true
    },
    formatName: {
        type: String,
        enum: formatNames,
        required: true
    },
    fixingType: {
        type: String,
        enum: fixingTypeEnums,
        required: true,
    },
    gameType: {
        type: String,
        enum: gameTypeRefs,
        required: true,
    },
    roundNumber: {
        type: Number,
        required: true,
    },
    roundName: {
        type: String,
        required: true,
    },
    bracket: {
        type: String,
        enum: ['winners', 'losers', 'Final Bracket'],
        default: 'winners'
    },
    matches: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'match',
        }
    ],
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'participantsRef',
        }
    ],
    winners: [
        {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'participantsRef'
        }
    ],
    participantsRef: {
        type: String,
        enum: participantRefs,
        required: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const roundModel = model<IRound>('round', roundSchema);

export default roundModel;