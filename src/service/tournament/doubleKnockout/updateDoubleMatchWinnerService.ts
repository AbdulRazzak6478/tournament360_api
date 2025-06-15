import mongoose, { ClientSession, ObjectId } from "mongoose";
import catchErrorMsgAndStatusCode from "../../../utils/catchError.js";
import AppError from "../../../utils/appError.js";
import statusCodes from "../../../constants/statusCodes.js";
import AppErrorCode from "../../../constants/appErrorCode.js";
import matchModel, { IMatch } from "../../../models/match.model.js";
import roundModel from "../../../models/round.model.js";
import TournamentModel from "../../../models/tournament.model.js";
import _ from "lodash";
type PartialMatchRef = Pick<IMatch, "_id" | "name">;

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

const updatingLoserIntoLoserBracketRoundMatch = async (
    roundNumber: number,
    matchDetails: { _id: string; tournamentID: string; participantA: string; participantB: string; winner: string },
    matchLoser: ObjectId,
    session: ClientSession
) => {
    try {
        let loserRound = await roundModel
            .findOne({
                tournamentID: matchDetails.tournamentID,
                roundNumber: roundNumber,
                bracket: "losers",
            })
            .select('participants matches')
            .populate<{ matches: Pick<IMatch, "_id" | "participantA" | "participantB" | "matchA" | "matchB">[] | [] }>({ path: "matches", select: "participantA participantB matchA matchB" })
            .session(session);
            console.log("assigned loser : ",matchDetails.tournamentID,roundNumber,loserRound);
        if (_.isEmpty(loserRound)) {
            throw new Error(",not found loser round to update ");
        }
        let exist = loserRound.participants?.filter((participantId) => {
            if (
                participantId.toString() === matchDetails?.winner.toString() ||
                participantId.toString() === matchDetails?.participantA?.toString() ||
                participantId.toString() === matchDetails?.participantB?.toString()
            ) {
                return participantId.toString();
            }
        });
        if (exist.length === 0) {
            loserRound.participants.push(matchLoser);
        } else {
            loserRound.participants = loserRound.participants.filter(
                (winnerId) => winnerId !== exist[0]
            );
            loserRound.participants.push(matchLoser);
        }
        loserRound = await loserRound.save({ session });
        for (let match of loserRound.matches) {
            if (
                match?.matchA &&
                match?.matchA?.toString() === matchDetails?._id?.toString()
            ) {
                match.participantA = matchLoser;

                await matchModel.updateOne(
                    { _id: match?._id },
                    { $set: { participantA: matchLoser } }
                );

                // match = await match.save({ session });
            }
            if (
                match?.matchB &&
                match?.matchB?.toString() === matchDetails?._id?.toString()
            ) {
                match.participantB = matchLoser;
                await matchModel.updateOne(
                    { _id: match?._id },
                    { $set: { participantA: matchLoser } }
                );
            }
        }

    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        throw new AppError(statusCode, message);
    }
};

const updateWinnerForDoubleKnockoutBrackets = async (data: updateWinnerType) => {
    const session = await mongoose.startSession();
    try {

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

        session.startTransaction();
        console.log(data)
        // 1.Fetch the Match with matchID
        const currentMatch = await matchModel.findById(data.matchID)
            .select("tournamentID roundID participantA participantB matchA matchB winner nextMatch status isCompleted")
            .populate<{ matchA: PartialMatchRef | null; matchB: PartialMatchRef | null }>([
                { path: "matchA", select: "_id name" },
                { path: "matchB", select: "_id name" },
            ])
            .session(session);
        if (_.isEmpty(currentMatch)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound("Match"));
        }

        // 2.check is it valid to announce winner for this match with current status
        if (currentMatch?.participantA || currentMatch?.participantB) {
            if (!currentMatch?.participantA && currentMatch?.matchA) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.winnerNotDeclaredForField(currentMatch?.matchA?.name));
            }
            if (!currentMatch?.participantB && currentMatch?.matchB) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.winnerNotDeclaredForField(currentMatch?.matchB?.name));
            }
        }
        else {
            if (currentMatch?.matchA && currentMatch?.matchB) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.winnerNotDeclaredForField(`${currentMatch?.matchA?.name} and ${currentMatch?.matchB?.name}`));
            } else if (currentMatch?.matchA || currentMatch?.matchB) {
                const message = (currentMatch?.matchA ? currentMatch?.matchA?.name : currentMatch?.matchB?.name) || "Previous Matches";
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.winnerNotDeclaredForField(message));
            } else {
                throw new AppError(statusCodes.BAD_REQUEST, "No Participants in a Match");
            }
        }

        // check winner is already declared or not
        if (currentMatch?.isCompleted) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.matchResultAlreadySet);
        }

        // 3.check the winner is valid for this match or not
        if (currentMatch?.participantA?.toString() !== data?.winnerID && currentMatch?.participantB?.toString() !== data?.winnerID) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.invalidWinnerSelection);
        }

        // 4.update the current match and correctly refactor and update winner in round
        currentMatch.winner = data?.winnerID as unknown as mongoose.Schema.Types.ObjectId;

        const currentRound = await roundModel.findById(currentMatch?.roundID)
            .select("roundNumber roundName winners matches isCompleted bracket")
            .populate([
                { path: "matches", select: "name" }
            ])
            .session(session);
        if (_.isEmpty(currentRound)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound("Round"))
        }
        const matchParticipantIds = [currentMatch?.participantA?.toString(), currentMatch?.participantB?.toString(), data?.winnerID?.toString()];
        const existWinners = currentRound.winners?.filter((winner) => (matchParticipantIds.includes(winner?.toString())));

        if (existWinners.length === 0) {
            currentRound.winners.push(currentMatch?.winner);
        } else {
            currentRound.winners = currentRound?.winners?.filter((winner) => !existWinners?.map((win) => win?.toString()).includes(winner?.toString()));
            currentRound.winners.push(currentMatch?.winner);
        }

        // 5.update the winner into its next match if it is next exist and update winner into next round participants record
        if (currentMatch?.nextMatch) {
            const nextMatchDetails = await matchModel.findById(currentMatch?.nextMatch)
                .select("roundID matchA matchB participantA participantB")
                .session(session);
            if (_.isEmpty(nextMatchDetails)) {
                throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound("Next Match"));
            }
            if (nextMatchDetails?.matchA?.toString() === currentMatch?._id?.toString()) {
                nextMatchDetails.participantA = currentMatch?.winner;
            }
            if (nextMatchDetails?.matchB?.toString() === currentMatch?._id?.toString()) {
                nextMatchDetails.participantB = currentMatch?.winner;
            }
            if (nextMatchDetails?.roundID?.toString() !== currentMatch?.roundID?.toString()) {
                const nextMatchRound = await roundModel.findById(nextMatchDetails?.roundID).select("participants").session(session);
                if (_.isEmpty(nextMatchRound)) {
                    throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound("Next Round"));
                }

                const existParticipants = nextMatchRound?.participants?.filter((participantId) => matchParticipantIds.includes(participantId?.toString()));
                if (existParticipants.length === 0) {
                    nextMatchRound.participants.push(currentMatch?.winner);
                }
                else {
                    const participantIds = existParticipants?.map((participant) => participant?.toString());
                    nextMatchRound.participants = nextMatchRound.participants.filter((participantId) => !participantIds.includes(participantId?.toString()));
                    nextMatchRound.participants.push(currentMatch?.winner);
                }
                await nextMatchRound.save({ session });
                console.log("next round :", nextMatchRound);
            }
            console.log("next match : ", nextMatchDetails);
            await nextMatchDetails.save({ session });
        }

        let matchLoser =
            currentMatch?.winner?.toString() === currentMatch?.participantA?.toString()
                ? currentMatch?.participantB
                : currentMatch?.participantA;
        if (matchLoser && currentRound?.bracket === "winners") {
            const matchDetails = {
                _id: currentMatch?._id?.toString(),
                tournamentID: currentMatch?.tournamentID?.toString(),
                participantA: currentMatch?.participantA?.toString(),
                participantB: currentMatch?.participantB?.toString(),
                winner: currentMatch?.winner?.toString()
            }
            await updatingLoserIntoLoserBracketRoundMatch(
                currentRound?.roundNumber,
                matchDetails,
                matchLoser,
                session
            );
        }
        // 6.check current round is complete or not

        if (currentRound.matches.length === currentRound?.winners.length) {
            currentRound.isCompleted = true;
        }

        await currentRound.save({ session });

        // 7.update previous match status to restrict redeclare winner for the match
        const prevMatchIds = [];
        if (currentMatch?.matchA) {
            prevMatchIds.push(currentMatch?.matchA?._id);
        }
        if (currentMatch?.matchB) {
            prevMatchIds.push(currentMatch?.matchB?._id);
        }
        if (prevMatchIds.length > 0) {
            await matchModel.updateMany(
                { _id: prevMatchIds },
                {
                    $set: { isCompleted: true }
                },
                { session: session }
            );
        }
        await currentMatch.save({ session });

        // 8.Update tournament status based on the match 

        if (data?.status === "PENDING") {
            await TournamentModel.updateOne(
                { _id: data?.tournamentId },
                { $set: { status: "ACTIVE" } },
                { runValidators: true, session: session }
            )
        }
        if (currentRound?.bracket === "Final Bracket") {
            await TournamentModel.updateOne(
                { _id: data?.tournamentId },
                { $set: { status: "COMPLETED" } },
                { runValidators: true, session: session }
            )
        }

        // 9.return current match 
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

export default updateWinnerForDoubleKnockoutBrackets;