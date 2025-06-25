import mongoose from "mongoose";
import catchErrorMsgAndStatusCode from "../../../utils/catchError.js";
import AppError from "../../../utils/appError.js";
import statusCodes from "../../../constants/statusCodes.js";
import AppErrorCode from "../../../constants/appErrorCode.js";
import _ from "lodash";
import matchModel from "../../../models/match.model.js";
import pointTablesModel, { IPointTable } from "../../../models/pointTable.model.js";
import TournamentModel from "../../../models/tournament.model.js";



type updateWinnerType = {
    tournamentId: string,
    status: string,
    matchID: string,
    winnerID: string
}
// to validate ObjectId()
function isValidObjectId(id: string) {
    return mongoose.Types.ObjectId.isValid(id);
}

const AnnounceRoundRobbinMatchWinner = async (data: updateWinnerType) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        if (!isValidObjectId(data?.tournamentId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired("tournamentId"));
        }
        if (!isValidObjectId(data?.matchID)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired("matchID"));
        }
        if (!isValidObjectId(data?.winnerID)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired("winnerID"));
        }
        if (!["PENDING", "ACTIVE", "COMPLETED"].includes(data?.status)) {
            throw new AppError(statusCodes.BAD_REQUEST, "status is invalid");
        }


        let currentMatch = await matchModel.findById(data.matchID)
            .select("roundID participantA participantB matchA matchB winner nextMatch status isCompleted")
            .session(session);
        if (_.isEmpty(currentMatch)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound("Match"));
        }


        if (currentMatch?.participantA?.toString() !== data?.winnerID && currentMatch?.participantB?.toString() !== data?.winnerID) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.invalidWinnerSelection);
        }


        if (currentMatch?.winner) {
            if (currentMatch?.winner?.toString() === data.winnerID) {
                await session.commitTransaction();
                await session.endSession();
                return currentMatch;
            }
            let standing: IPointTable[] = await pointTablesModel
                .find({
                    participantID: [
                        currentMatch?.participantA,
                        currentMatch?.participantB,
                    ],
                })
                .select('_id participantID points plays wins losses')
                .session(session).lean();
            if (_.isEmpty(standing)) {
                throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound('Participant Standing'));
            }
            // revert back to previous state
            const bulkUpdates = [];
            for (let record of standing) {
                if (
                    record.participantID.toString() === currentMatch?.winner?.toString()
                ) {
                    record.points -= 2;
                    record.plays--;
                    record.wins--;
                } else {
                    record.plays--;
                    record.losses--;
                }
                if (record.participantID.toString() === data.winnerID) {
                    record.points += 2;
                    record.plays++;
                    record.wins++;
                    bulkUpdates.push({
                        updateOne: {
                            filter: { _id: record?._id },
                            update: {
                                $set: {
                                    points: record?.points,
                                    plays: record?.plays,
                                    losses: record?.losses,
                                    wins: record?.wins
                                }
                            }
                        }
                    });
                    // record = await record.save({ session });
                } else {
                    record.plays++;
                    record.losses++;
                    bulkUpdates.push({
                        updateOne: {
                            filter: { _id: record?._id },
                            update: {
                                $set: {
                                    points: record?.points,
                                    plays: record?.plays,
                                    losses: record?.losses,
                                    wins: record?.wins
                                }
                            }
                        }
                    })
                    // record = await record.save({ session });
                }
            }
            await pointTablesModel.bulkWrite(bulkUpdates, { session });

            currentMatch.winner = data.winnerID as unknown as mongoose.Schema.Types.ObjectId;
            currentMatch = await currentMatch.save({ session });
            await session.commitTransaction();
            await session.endSession();
            return currentMatch;
        }

        currentMatch.winner = data.winnerID as unknown as mongoose.Schema.Types.ObjectId;
        let standing = await pointTablesModel
            .find({
                participantID: [
                    currentMatch?.participantA,
                    currentMatch?.participantB,
                ],
            })
            .session(session);
        if (_.isEmpty(standing)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound('Participant Standing'));
        }
        for (let record of standing) {
            if (record.participantID.toString() === data.winnerID) {
                record.points += 2;
                record.plays++;
                record.wins++;
                record = await record.save({ session });
            } else {
                record.plays++;
                record.losses++;
                record = await record.save({ session });
            }
        }

        currentMatch = await currentMatch.save({ session });

        if (data.status === "PENDING") {
            await TournamentModel.updateOne(
                { _id: currentMatch.tournamentID },
                { $set: { status: 'ACTIVE' } }
            )
        }

        const tournamentInCompleteMatches = await matchModel
            .find({
                tournamentID: currentMatch?.tournamentID,
                winner: null,
            })
            .select('tournamentID winner')
            .session(session);

        if (tournamentInCompleteMatches.length === 0) {
            await TournamentModel.updateOne(
                { _id: currentMatch.tournamentID },
                { $set: { status: 'COMPLETED' } }
            )
        }

        await session.commitTransaction();
        await session.endSession();
        return { match: currentMatch };
    } catch (error) {
        await session.abortTransaction();
        await session.endSession();
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        throw new AppError(statusCode, message);
    }
}

export default AnnounceRoundRobbinMatchWinner;