import AppErrorCode from "../../../constants/app-error-codes.constant.js";
import statusCodes from "../../../constants/status-codes.constant.js";
import TournamentModel from "../../../models/tournament.model.js";
import getKnockoutFixturesService from "../../../services/game-fixtures.service.js";
import AppError from "../../../utils/app-error.util.js";
import catchAsync from "../../../utils/catch-async.util.js";
import catchErrorMsgAndStatusCode from "../../../utils/catch-error.util.js";
import { failed_response, success_response } from "../../../utils/response.util.js";
import _ from "lodash";


const getGameFixturesController = catchAsync(async (req, res) => {

    try {
        // 1.Get the tournamentID from the request body
        const { tournamentID } = req.params;
        const { bracket } = req.body;
        // 2.Validate the tournamentID and bracket
        if (_.isEmpty(tournamentID)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired("tournamentID"));
        }
        if (_.isEmpty(bracket)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired("bracket"));
        }
        if (!['winners', 'losers', 'Final Bracket'].includes(bracket)) {
            throw new AppError(statusCodes.BAD_REQUEST, "bracket is invalid, it should be winners, losers or final bracket.");
        }

        // 3.Check if the tournamentID is valid tournamentID
        const tournamentDetails = await TournamentModel.findOne({ tournamentID }).select("formatName status").lean();
        if (_.isEmpty(tournamentDetails)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound("Tournament"));
        }
        // 3.call service based on tournament format to get fixtures
        let responseData = {}
        if (tournamentDetails?.formatName === "knockout") {
            responseData = await getKnockoutFixturesService({
                tournamentId: tournamentDetails?._id as unknown as string,
                bracket
            });
        }
        if (tournamentDetails?.formatName === "double_elimination_bracket") {
            responseData = await getKnockoutFixturesService({
                tournamentId: tournamentDetails?._id as unknown as string,
                bracket
            });
            // responseData = {
            //     message: "work in progress for double_elimination_bracket",
            // }
        }
        if (tournamentDetails?.formatName === "round_robbin") {
            responseData = await getKnockoutFixturesService({
                tournamentId: tournamentDetails?._id as unknown as string,
                bracket
            });
            // responseData = {
            //     message: "work in progress for round_robbin",
            // };
        }
        // 4.return the fixtures in the response
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Game Fixtures",
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
                    "Failed to Get Game Fixtures",
                    { message },
                    false
                )
            );
    }
});

export default getGameFixturesController;