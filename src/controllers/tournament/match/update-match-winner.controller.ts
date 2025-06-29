import mongoose from "mongoose";
import catchAsync from "../../../utils/catch-async.util.js";
import catchErrorMsgAndStatusCode from "../../../utils/catch-error.util.js";
import { failed_response, success_response } from "../../../utils/response.util.js";
import AppError from "../../../utils/app-error.util.js";
import statusCodes from "../../../constants/status-codes.constant.js";
import AppErrorCode from "../../../constants/app-error-codes.constant.js";
import _ from "lodash";
import TournamentModel from "../../../models/tournament.model.js";
import updateWinnerInKnockoutTournament from "../../../services/tournament/knockout/update-knockout-match-winner.service.js";
import updateWinnerForDoubleKnockoutBrackets from "../../../services/tournament/double-knockout/update-double-match-winner.service.js";
import AnnounceRoundRobbinMatchWinner from "../../../services/tournament/round-robbin/updateRRMatchWinner.service.js";



// to validate ObjectId()
function isValidObjectId(id: string) {
    return mongoose.Types.ObjectId.isValid(id);
}

const updateMatchWinnerController = catchAsync(async (req, res) => {

    try {
        const { tournamentID } = req.params;
        const { matchID, winnerID } = req.body;
        if (_.isEmpty(tournamentID)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired("tournamentID"));
        }

        if (!isValidObjectId(matchID)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired("matchID"));
        }
        if (!isValidObjectId(winnerID)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired("winnerID"));
        }
        const tournament = await TournamentModel.findOne({ tournamentID }).select("formatName status").lean();

        if (_.isEmpty(tournament)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound("Tournament"));
        }
        // , 'double_elimination_bracket', 'round_robbin'
        let responseData = {}
        if (tournament?.formatName === "knockout") {
            responseData = await updateWinnerInKnockoutTournament({
                tournamentId: tournament?._id as unknown as string,
                status: tournament?.status,
                matchID,
                winnerID
            });
            // responseData = {
            //     message: "work in progress for knockout"
            // };
        }
        if (tournament?.formatName === "double_elimination_bracket") {
            console.log("test winner:", tournament);
            responseData = await updateWinnerForDoubleKnockoutBrackets({
                tournamentId: tournament?._id as unknown as string,
                status: tournament?.status,
                matchID,
                winnerID
            });
            // responseData = {
            //     message: "work in progress for double_elimination_bracket",
            // };
        }
        if (tournament?.formatName === "round_robbin") {

            responseData = await AnnounceRoundRobbinMatchWinner({
                tournamentId: tournament?._id as unknown as string,
                status: tournament?.status,
                matchID,
                winnerID
            });
            // responseData = {
            //     message: "work in progress for double_elimination_bracket",
            // };
        }

        return res
            .status(statusCodes.OK)
            .json(
                success_response(
                    statusCodes.OK,
                    "Tournament match Winner Updated!",
                    responseData,
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
                    "Failed to Edit Tournament",
                    { message },
                    false
                )
            );
    }
});


export default updateMatchWinnerController;