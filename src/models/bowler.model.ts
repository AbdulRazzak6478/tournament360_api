import mongoose, { Document, model, Schema } from "mongoose"



export interface IBowler extends Document {
    tournamentID: mongoose.Schema.Types.ObjectId;
    matchID: mongoose.Schema.Types.ObjectId;
    teamID: mongoose.Schema.Types.ObjectId;
    bowlerID: mongoose.Schema.Types.ObjectId;
    runs: number;
    overs: number;
    wickets: number;
}

const bowlerSchema = new Schema<IBowler>({
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
    wickets: { type: Number, default: 0 },
}, { timestamps: true });

const bowlerModel = model<IBowler>("bowler", bowlerSchema);

export default bowlerModel;