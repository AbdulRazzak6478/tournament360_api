import mongoose from "mongoose";
import AppErrorCode from "../../../constants/app-error-codes.constant";
import statusCodes from "../../../constants/status-codes.constant";
import AppError from "../../../utils/app-error.util";
import catchAsync from "../../../utils/catch-async.util";
import _ from "lodash";
import { failed_response, success_response } from "../../../utils/response.util";
import catchErrorMsgAndStatusCode from "../../../utils/catch-error.util";
import matchModel from "../../../models/match.model";

// to validate ObjectId()
function isValidObjectId(id: string) {
    return mongoose.Types.ObjectId.isValid(id);
}

const fetchMatchDetails = catchAsync(async (req, res) => {
    try {

        // Step 1 : Extract the match Id from request param
        const { matchId } = req.params;

        // Step 2 : Validate matchId

        // 2.1 : Check the matchId is valid or not
        if (_.isEmpty(matchId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('matchId'));
        }
        if (!isValidObjectId(matchId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired("matchId"));
        }

        const matchDetails = await matchModel.findById(matchId)
            .populate([
                { path: 'participantA', select: 'name' },
                { path: 'participantB', select: 'name' },
            ]).lean();


        return res
            .status(statusCodes.OK)
            .json(
                success_response(
                    statusCodes.OK,
                    "Match Fetch Successfully",
                    { matchDetails },
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
                    "Failed To Fetch Match",
                    { message },
                    false
                )
            );
    }
});

export {
    fetchMatchDetails,
    
}