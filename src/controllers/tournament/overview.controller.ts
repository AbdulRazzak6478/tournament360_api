import _ from "lodash";
import AppErrorCode from "../../constants/app-error-codes.constant.js";
import statusCodes from "../../constants/status-codes.constant.js";
import AppError from "../../utils/app-error.util.js";
import catchAsync from "../../utils/catch-async.util.js";
import catchErrorMsgAndStatusCode from "../../utils/catch-error.util.js";
import { failed_response, success_response } from "../../utils/response.util.js";
import TournamentModel from "../../models/tournament.model.js";


const tournamentOverview = catchAsync(async (req, res) => {

    try {

        // Step 1 : Extract the Tournament Id from request param
        const { tournamentID } = req.params;

        // Step 2 : Validate tournament Id
        if (_.isEmpty(tournamentID)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('tournamentID'));
        }
        if (tournamentID.length !== 15 || tournamentID.slice(3) !== 'TMT') {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.invalidFieldFormat('tournamentID'));
        }

        // Step 3 : Check Tournament Exist Or Not
        const tournament = await TournamentModel.findOne({ tournamentID })
            .select('_id tournamentID sportName formatName fixingType gameType tournamentName description BannerImg status startDate endDate scoreType')
            .lean();

        if (_.isEmpty(tournament)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Tournament'));
        }
        // Step 4 : Return the Payload

        return res
            .status(statusCodes.OK)
            .json(
                success_response(
                    statusCodes.OK,
                    "Tournament Details Fetch Successfully.",
                    { tournament },
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
                    "Failed To Fetch tournament Details",
                    { message },
                    false
                )
            );
    }
});

export {
    tournamentOverview
}