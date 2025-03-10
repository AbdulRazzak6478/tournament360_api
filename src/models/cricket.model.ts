import mongoose, { model, Schema } from "mongoose";


export interface ICricket extends Document {
    tournamentID: mongoose.Schema.Types.ObjectId;
    matchID: mongoose.Schema.Types.ObjectId;
    teamA_ID: mongoose.Schema.Types.ObjectId;
    teamB_ID: mongoose.Schema.Types.ObjectId;
    resultScore: number;
    resultStatus: string;
    result: string;
    tossWinner: mongoose.Schema.Types.ObjectId;
    strike: mongoose.Schema.Types.ObjectId;
    offStrike: mongoose.Schema.Types.ObjectId;
    bowlerStrike: mongoose.Schema.Types.ObjectId;
    tossWinChoice: string;
    tossOptions: string[];
    scoreA: number;
    scoreB: number;
    totalOvers: number;
    wicketsA: number;
    wicketsB: number;
    oversA: number;
    oversB: number;
    inning: number;
    oversA_Track: mongoose.Schema.Types.ObjectId[];
    oversB_Track: mongoose.Schema.Types.ObjectId[];
    bowlersA: mongoose.Schema.Types.ObjectId[];
    bowlersB: mongoose.Schema.Types.ObjectId[];
    batsmenA: mongoose.Schema.Types.ObjectId[];
    batsmenB: mongoose.Schema.Types.ObjectId[];
}

const cricketSchema = new Schema<ICricket>({
    tournamentID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true,
    },
    matchID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'match',
        required: true,
    },
    teamA_ID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'team',
        default: null,
    },
    teamB_ID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'team',
        default: null
    },
    resultScore: {
        type: Number,
        default: 0
    },
    resultStatus: {
        type: String,
        default: ""
    },
    result: {
        type: String,
        default: ""
    },
    tossWinner: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'team',
        default: null
    },
    strike: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'team',
        default: null
    },
    offStrike: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'team',
        default: null
    },
    bowlerStrike: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'bowler',
        default: null
    },
    tossWinChoice: {
        type: String,
        default: ""
    },
    tossOptions: [
        {
            type: String
        }
    ],
    scoreA: {
        type: Number,
        default: 0
    },
    scoreB: {
        type: Number,
        default: 0
    },
    totalOvers: {
        type: Number,
        default: 0
    },
    wicketsA: {
        type: Number,
        default: 0
    },
    wicketsB: {
        type: Number,
        default: 0
    },
    oversA: {
        type: Number,
        default: 0
    },
    oversB: {
        type: Number,
        default: 0
    },
    inning: {
        type: Number,
        default: 0
    },
    oversA_Track: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'over',
            default: null
        }
    ],
    oversB_Track: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'over',
            default: null
        }
    ],
    bowlersA: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'bowler',
            default: null
        }
    ],
    bowlersB: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'bowler',
            default: null
        }
    ],
    batsmenA: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'batsmen',
            default: null
        }
    ],
    batsmenB: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'batsmen',
            default: null
        }
    ]
}, { timestamps: true });


const cricketModel = model<ICricket>('cricket', cricketSchema);

export default cricketModel;