import _ from "lodash";
import AppErrorCode from "../../constants/app-error-codes.constant.js";
import statusCodes from "../../constants/status-codes.constant.js";
import TournamentModel from "../../models/tournament.model.js";
import AppError from "../../utils/app-error.util.js";
import catchAsync from "../../utils/catch-async.util.js";
import catchErrorMsgAndStatusCode from "../../utils/catch-error.util.js";
import { failed_response, success_response } from "../../utils/response.util.js";
import mongoose from "mongoose";
import refereeModel from "../../models/referee.model.js";


const addRefereeIntoTournament = catchAsync(async (req, res) => {
    try {
        // Step 1 : Extract the referee details and Tournament id
        const { tournamentID } = req.params;
        const { name, email, mobileNumber, totalExperience } = req.body;

        // Step 2 : Validate the referee details and tournament Id
        // Validate referee id
        if (_.isEmpty(tournamentID)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('tournamentID'));
        }
        if (tournamentID.length !== 15 || tournamentID.slice(3) !== 'TMT') {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.invalidFieldFormat('tournamentID'));
        }

        // Validate referee details
        if (_.isEmpty(name)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('referee name'));
        }



        // Step 3 : Check Tournament Exist or not
        const tournament = await TournamentModel.exists({ tournamentID })

        if (_.isEmpty(tournament)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Tournament'));
        }

        // Step 4 : generate add referee payload
        const addRefereePayload: {
            name: string;
            email?: boolean;
            mobileNumber?: string;
            totalExperience?: string;
        } = {
            name
        };
        if (email) {
            addRefereePayload.email = email;
        }
        if (mobileNumber) {
            addRefereePayload.mobileNumber = mobileNumber;
        }
        if (totalExperience) {
            addRefereePayload.totalExperience = totalExperience;
        }

        // Step 5 : Add referee
        const referee = await refereeModel.create({ tournamentID: tournament?._id, ...addRefereePayload });
        if (_.isEmpty(referee)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Tournament Referee'));
        }
        // step 6 : return referee Payload

        return res.status(statusCodes.CREATED).json(
            success_response(
                statusCodes.CREATED,
                "Tournament Referee Added successfully.",
                { referee },
                true
            )
        );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res.status(statusCode).json(
            failed_response(
                statusCode,
                "failed to add tournament referee",
                { message },
                false
            )
        );
    }
});

const fetchTournamentReferees = catchAsync(async (req, res) => {
    try {
        // Step 1 : Extract Tournament id from the request
        const { tournamentID } = req.params;

        // Step 2 : Validate tournament Id

        // Validate Tournament id
        if (_.isEmpty(tournamentID)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('tournamentID'));
        }
        if (tournamentID.length !== 15 || tournamentID.slice(3) !== 'TMT') {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.invalidFieldFormat('tournamentID'));
        }

        // Step 3 : Check Tournament Exist or not
        const tournament = await TournamentModel.exists({ tournamentID })

        if (_.isEmpty(tournament)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Tournament'));
        }

        // Step 4 : fetch tournament referees

        let referees = await refereeModel.find({ tournamentID: tournament?._id }).select('name email mobileNumber updatedAt').lean();

        // step 5 : return referees Payload

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Successfully Fetch Tournament Referees",
                { referees },
                true
            )
        );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res.status(statusCode).json(
            failed_response(
                statusCode,
                "failed to fetch tournament referees",
                { message },
                false
            )
        );
    }
});

// to validate ObjectId()
function isValidObjectId(id: string) {
    return mongoose.Types.ObjectId.isValid(id);
}
const fetchSpecificTournamentReferees = catchAsync(async (req, res) => {
    try {
        // Step 1 : Extract Tournament id from the request
        const { refereeId } = req.params;

        // Step 2 : Validate tournament Id

        // Validate Tournament id
        if (_.isEmpty(refereeId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('refereeId'));
        }
        if (!isValidObjectId(refereeId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired('refereeId'));
        }

        // Step 3 : Fetch referee
        let referee = await refereeModel.findById(refereeId).lean();

        if (_.isEmpty(referee)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Referee'));
        }

        // step 4 : return referee Payload

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Successfully Fetch Tournament Referee",
                { referee },
                true
            )
        );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res.status(statusCode).json(
            failed_response(
                statusCode,
                "failed to fetch tournament referee",
                { message },
                false
            )
        );
    }
});

const editSpecificTournamentReferee = catchAsync(async (req, res) => {
    try {
        // Step 1 : Extract the referee details and referee id
        const { refereeId } = req.params;
        const { name, email, mobileNumber, totalExperience } = req.body;

        // Step 2 : Validate the referee details and referee Id
        // Validate referee id
        if (_.isEmpty(refereeId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('refereeId'));
        }
        if (!isValidObjectId(refereeId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired('refereeId'));
        }

        // Validate referee details
        if (_.isEmpty(name)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('referee name'));
        }


        // Step 3 : generate add referee payload
        const addRefereePayload: {
            name: string;
            email?: boolean;
            mobileNumber?: string;
            totalExperience?: string;
        } = {
            name
        };
        if (email) {
            addRefereePayload.email = email;
        }
        if (mobileNumber) {
            addRefereePayload.mobileNumber = mobileNumber;
        }
        if (totalExperience) {
            addRefereePayload.totalExperience = totalExperience;
        }


        // Step 4 : fetch referee
        const referee = await refereeModel.exists({ _id: refereeId });
        if (_.isEmpty(referee)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Tournament Referee'));
        }

        await refereeModel.updateOne(
            { _id: referee?._id },
            { $set: addRefereePayload }
        )
        // step 5 : return referee Payload

        return res.status(statusCodes.CREATED).json(
            success_response(
                statusCodes.CREATED,
                "Tournament Referee Updated successfully.",
                { referee },
                true
            )
        );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res.status(statusCode).json(
            failed_response(
                statusCode,
                "failed to edit tournament referee",
                { message },
                false
            )
        );
    }
});

const removeTournamentReferee = catchAsync(async (req, res) => {
    try {
        // Step 1 : Extract referee from params
        const { refereeId } = req.params;

        // Step 2 : Validate refereeId
        if (_.isEmpty(refereeId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('refereeId'));
        }

        if (!isValidObjectId(refereeId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired('refereeId'));
        }

        // Step 3 : Check referee exist or not
        const referee = await refereeModel.exists({ _id: refereeId });
        if (_.isEmpty(referee)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound('Referee'));
        }

        // Step 4 : delete referee
        await refereeModel.deleteOne({ _id: referee?._id });

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Tournament Referee Remove successfully.",
                { referee },
                true
            )
        );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res.status(statusCode).json(
            failed_response(
                statusCode,
                "failed to remove tournament referee",
                { message },
                false
            )
        );
    }
});


const refereeController = {
    addRefereeIntoTournament,
    fetchTournamentReferees,
    fetchSpecificTournamentReferees,
    editSpecificTournamentReferee,
    removeTournamentReferee
}

export default refereeController;