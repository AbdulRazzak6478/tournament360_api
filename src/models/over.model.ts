import mongoose, { Document, model, Schema } from "mongoose"



export interface IOver extends Document {
    tournamentID: mongoose.Schema.Types.ObjectId;
    matchID: mongoose.Schema.Types.ObjectId;
    teamID: mongoose.Schema.Types.ObjectId;
    bowlerID: mongoose.Schema.Types.ObjectId;
    bowls: string[];
    track: string[];
}

const overSchema = new Schema<IOver>({
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
    bowls: [{ type: String, default: "" }],
    track: [{ type: String, default: "" }]
}, { timestamps: true });

const overModel = model<IOver>("over", overSchema);

export default overModel;