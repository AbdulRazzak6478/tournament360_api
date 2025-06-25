import mongoose from "mongoose";
import statusCodes from "../../constants/statusCodes.js";
import catchAsync from "../../utils/catchAsync.js";
import catchErrorMsgAndStatusCode from "../../utils/catchError.js";
import { failed_response, success_response } from "../../utils/response.js";
import AppError from "../../utils/appError.js";
import AppErrorCode from "../../constants/appErrorCode.js";
import _ from "lodash";
import TournamentModel from "../../models/tournament.model.js";


const restoreTournament = catchAsync(async (req, res) => {
    try {

        // Step 1 : Extract the fields from request and Validate fields
        const { tournamentID } = req.params;

        if (_.isEmpty(tournamentID) || !mongoose.Types.ObjectId.isValid(tournamentID)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldMustBeaValidObjectId("tournamentID"))
        }

        // Step 2 : Validate the Tournament exist or not
        const isTournamentExist = await TournamentModel.exists({ _id: tournamentID });

        if (_.isEmpty(isTournamentExist)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotExist('Tournament'));
        }

        // Step 3 : Update Tournament to Restore it
        await TournamentModel.updateOne(
            { _id: isTournamentExist?._id },
            { $set: { isDeleted: false, deleteRemark: '' } }
        );

        // Step 4 : Return response
        return res
            .status(statusCodes.OK)
            .json(
                success_response(
                    statusCodes.OK,
                    `Tournament Restored Successfully`,
                    {
                        tournamentID: isTournamentExist?._id,
                        message: 'Tournament Restored!'
                    },
                    true
                )
            );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        console.log("Error in Restore tournament controller : ", message);
        return res
            .status(statusCode)
            .json(
                failed_response(
                    statusCode,
                    "Failed to Restore Tournament",
                    { message: message },
                    false
                )
            );
    }
});

export default restoreTournament;