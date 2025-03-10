import mongoose, { Document, model, Schema } from "mongoose"



export interface IBatsmen extends Document {
    tournamentID: mongoose.Schema.Types.ObjectId;
    matchID: mongoose.Schema.Types.ObjectId;
    teamID: mongoose.Schema.Types.ObjectId;
    bowlerID: mongoose.Schema.Types.ObjectId;
    runs: number;
    fours: number;
    sixes: number;
    overs: number;
}

const batsmenSchema = new Schema<IBatsmen>({
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
    teamID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'team',
        required: true,
    },
    bowlerID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'player',
        required: true,
    },
    runs: { type: Number, default: 0 },
    overs: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
}, { timestamps: true });

const batsmenModel = model<IBatsmen>("bowler", batsmenSchema);

export default batsmenModel;