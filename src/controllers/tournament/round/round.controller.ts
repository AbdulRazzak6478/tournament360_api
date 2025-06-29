import mongoose from "mongoose";
import AppErrorCode from "../../../constants/app-error-codes.constant";
import statusCodes from "../../../constants/status-codes.constant";
import AppError from "../../../utils/app-error.util";
import catchAsync from "../../../utils/catch-async.util";
import _ from "lodash";
import { failed_response, success_response } from "../../../utils/response.util";
import catchErrorMsgAndStatusCode from "../../../utils/catch-error.util";
import roundModel from "../../../models/round.model";
import teamModel from "../../../models/team.model";
import playerModel from "../../../models/player.model";

// to validate ObjectId()
function isValidObjectId(id: string) {
    return mongoose.Types.ObjectId.isValid(id);
}

const getParticipants = async (gameType: string, tournamentId: string) => {
    try {
        let participants;
        if (gameType === 'team') {
            participants = await teamModel.find({ tournamentID: tournamentId }).select('name').lean();
        } else {
            participants = await playerModel.find({ tournamentID: tournamentId }).select('name').lean();
        }
        participants = participants.map((participant) => ({ id: participant?._id?.toString(), name: participant?.name }));

        return participants;
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        throw new AppError(statusCode, message);
    }
}

const fetchRoundParticipants = catchAsync(async (req, res) => {
    try {

        // Step 1 : Extract the round Id from request param
        const { roundId } = req.params;

        // Step 2 : Validate roundId

        // 2.1 : Check the roundId is valid or not
        if (_.isEmpty(roundId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('roundId'));
        }
        if (!isValidObjectId(roundId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired("roundId"));
        }

        // Step 3 : Fetch Round 

        const round = await roundModel.findById(roundId)
            .select('roundName tournamentID roundNumber bracket participants winners matches')
            .populate<{
                matches: {
                    _id: string,
                    name: string,
                    participantA: mongoose.Schema.Types.ObjectId | null,
                    participantB: mongoose.Schema.Types.ObjectId | null,
                    matchA: mongoose.Schema.Types.ObjectId | null,
                    matchB: mongoose.Schema.Types.ObjectId | null,
                }[]
            }>(
                {
                    path: "matches", select: "name participantA participantB matchA matchB"
                }
            )
            .lean();

        if (_.isEmpty(round)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound('Round'));
        }

        // check the winner announced in round or not
        if (round?.winners.length > 0) {
            throw new AppError(statusCodes.BAD_REQUEST, 'Winner Announced, Can\'t Arrange Participants');
        }

        // Check Previous Winner bracket round is completed or not
        if (round?.roundNumber > 1 && round?.bracket === 'winners') {
            const previousRound = await roundModel.findOne({ tournamentID: round?.tournamentID, bracket: 'winners', roundNumber: round?.roundNumber - 1 })
                .select('roundNumber bracket isCompleted')
                .lean();
            if (previousRound?.isCompleted) {
                throw new AppError(statusCodes.BAD_REQUEST, `Previous round not completed to arrange participants into ${round?.roundName}`);
            }
        }

        // Check winners bracket round 1 is completed or not, if it is losers round 1
        if (round?.roundNumber === 1 && round?.bracket === 'losers') {
            const WinnerRound = await roundModel.findOne({ tournamentID: round?.tournamentID, bracket: 'winners', roundNumber: 1 })
                .select('roundNumber isCompleted')
                .lean();
            if (WinnerRound?.isCompleted) {
                throw new AppError(statusCodes.BAD_REQUEST, `winners Bracket round not completed to arrange participants into Losers Bracket ${round?.roundName}`);
            }
        }

        // check matches all participants are assign or not else throw error
        if (round?.roundNumber !== 1 && round?.bracket !== "winners") {
            // iterate over matches and check all participants are arrived to there place or not
            round.matches.forEach((match) => {
                const matchA = match.matchA ? true : false;
                const matchB = match.matchB ? true : false;
                const teamA = match.participantA ? true : false;
                const teamB = match.participantB ? true : false;
                if (matchA !== teamA) {
                    throw new AppError(statusCodes.BAD_REQUEST, `${match?.name}'s Participants are not Arrived Yet`);
                }
                if (matchB !== teamB) {
                    throw new AppError(statusCodes.BAD_REQUEST, `${match?.name}'s Participants are not Arrived Yet`);
                }
            });
        }

        const participants = await getParticipants(
            round?.gameType,
            round?.tournamentID as unknown as string
        );
        const newMap = new Map();
        participants.forEach((participant) => {
            newMap.set(participant?.id, participant.name);
        });
        const roundMatches = round?.matches.map((match) => {
            const teamA = newMap.get(match?.participantA?.toString());
            const teamB = newMap.get(match?.participantB?.toString());
            return {
                id: match?._id?.toString(),
                matchName: match?.name,
                teamA_id: match?.participantA?.toString(),
                teamB_id: match?.participantB?.toString(),
                teamA,
                teamB,
            };
        });

        let responsePayload = {
            name: round?.roundName,
            participantsLength: participants?.length,
            participants,
            matchesLength: roundMatches?.length,
            roundMatches,
        };


        return res
            .status(statusCodes.OK)
            .json(
                success_response(
                    statusCodes.OK,
                    "Round Fetch Successfully",
                    responsePayload,
                    true
                )
            );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res
            .status(statusCode)
            .json(
                failed_response(
                    statusCode,
                    "Failed To Fetch Round To Arrange Participants",
                    { message },
                    false
                )
            );
    }
});

export {
    fetchRoundParticipants,

}