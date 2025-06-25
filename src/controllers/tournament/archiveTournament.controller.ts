import mongoose from "mongoose";
import statusCodes from "../../constants/statusCodes.js";
import catchAsync from "../../utils/catchAsync.js";
import catchErrorMsgAndStatusCode from "../../utils/catchError.js";
import { failed_response, success_response } from "../../utils/response.js";
import AppError from "../../utils/appError.js";
import AppErrorCode from "../../constants/appErrorCode.js";
import _ from "lodash";
import TournamentModel from "../../models/tournament.model.js";


const archiveTournament = catchAsync(async (req, res) => {
    try {

        // Step 1 : Extract the fields from request and Validate fields
        const { tournamentID } = req.params;
        const { remark } = req.body;

        if (_.isEmpty(tournamentID) || !mongoose.Types.ObjectId.isValid(tournamentID)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldMustBeaValidObjectId("tournamentID"))
        }
        if (_.isEmpty(remark)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('Remark'));
        }

        // Step 2 : Validate the Tournament exist or not
        const isTournamentExist = await TournamentModel.exists({ _id: tournamentID });

        if (_.isEmpty(isTournamentExist)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotExist('Tournament'));
        }

        // Step 3 : Update Tournament to Archive it
        await TournamentModel.updateOne(
            { _id: isTournamentExist?._id },
            { $set: { isDeleted: true, deleteRemark: remark } }
        );

        // Step 4 : Return response
        return res
            .status(statusCodes.OK)
            .json(
                success_response(
                    statusCodes.OK,
                    `Tournament Archived Successfully`,
                    {
                        tournamentID: isTournamentExist?._id,
                        message: 'Tournament Archived!'
                    },
                    true
                )
            );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        console.log("Error in archive tournament controller : ", message);
        return res
            .status(statusCode)
            .json(
                failed_response(
                    statusCode,
                    "Failed to Archive Tournament",
                    { message: message },
                    false
                )
            );
    }
});

export default archiveTournament;