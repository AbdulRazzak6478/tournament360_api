import mongoose from "mongoose";
import AppErrorCode from "../../../constants/app-error-codes.constant";
import statusCodes from "../../../constants/status-codes.constant";
import AppError from "../../../utils/app-error.util";
import catchAsync from "../../../utils/catch-async.util";
import _ from "lodash";
import { failed_response, success_response } from "../../../utils/response.util";
import catchErrorMsgAndStatusCode from "../../../utils/catch-error.util";
import matchModel from "../../../models/match.model";
import refereeModel from "../../../models/referee.model";
import venueModel from "../../../models/venue.model";

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

const updateMatchDetails = catchAsync(async (req, res) => {
    try {

        // Step 1 : Extract the match Id from request param
        const { matchId } = req.params;
        const { refereeId, dateOfPlay, venueId } = req.body;

        // Step 2 : Validate matchId and match details

        // 2.1 : Check the matchId is valid or not
        if (_.isEmpty(matchId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('matchId'));
        }
        if (!isValidObjectId(matchId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired("matchId"));
        }
        if (!isValidObjectId(refereeId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired("refereeId"));
        }
        if (!isValidObjectId(venueId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired("venueId"));
        }
        if (_.isEmpty(dateOfPlay)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired("dateOfPlay"));
        }
        const date = new Date(dateOfPlay);
        if (!date) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.invalidFieldFormat("dateOfPlay Date"));
        }

        // Step 3 : Check Match, referee and venue exist or not
        const [match, referee, venue] = await Promise.all([
            // Fetch Match is exist or not
            matchModel.exists({ _id: matchId }),

            // Fetch Referee is exist or not
            refereeModel.exists({ _id: refereeId }),

            // Fetch venue is exist or not
            venueModel.exists({ _id: venueId }),
        ])

        if (_.isEmpty(match)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound("match"));
        }
        if (_.isEmpty(referee)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound("referee"));
        }
        if (_.isEmpty(venue)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound("venue"));
        }

        // Step 4 : Update Match
        await matchModel.updateOne(
            { _id: match?._id },
            {
                $set: {
                    refereeID: referee?._id,
                    venueID: venue?._id,
                    dateOfPlay
                }
            }
        )



        return res
            .status(statusCodes.OK)
            .json(
                success_response(
                    statusCodes.OK,
                    "Match Details updated Successfully",
                    { message: 'Match details updated' },
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
                    "Failed To update Match details",
                    { message },
                    false
                )
            );
    }
});



const matchController = {
    fetchMatchDetails,
    updateMatchDetails,

}

export default matchController;