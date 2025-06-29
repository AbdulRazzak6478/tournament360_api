import _ from "lodash";
import AppErrorCode from "../../constants/app-error-codes.constant.js";
import statusCodes from "../../constants/status-codes.constant.js";
import sponsorModel from "../../models/sponsor.model.js";
import TournamentModel from "../../models/tournament.model.js";
import AppError from "../../utils/app-error.util.js";
import catchAsync from "../../utils/catch-async.util.js";
import catchErrorMsgAndStatusCode from "../../utils/catch-error.util.js";
import { failed_response, success_response } from "../../utils/response.util.js";
import mongoose from "mongoose";


const addSponsorIntoTournament = catchAsync(async (req, res) => {
    try {
        // Step 1 : Extract the sponsor details and Tournament id
        const { tournamentID } = req.params;
        const { name, defaultSponsor, accountHolderName, accountNumber, bankName, IFSC_code, accountType } = req.body;

        // Step 2 : Validate the sponsor details and tournament Id
        // Validate Tournament id
        if (_.isEmpty(tournamentID)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('tournamentID'));
        }
        if (tournamentID.length !== 15 || tournamentID.slice(3) !== 'TMT') {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.invalidFieldFormat('tournamentID'));
        }

        // Validate sponsor details
        if (_.isEmpty(name)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('sponsor name'));
        }
        if (!_.isEmpty(accountType) && !['saving', 'current'].includes(accountType?.toLowerCase())) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.invalidField('accountType, it must be saving or current'));
        }


        // Step 3 : Check Tournament Exist or not
        const tournament = await TournamentModel.exists({ tournamentID })

        if (_.isEmpty(tournament)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Tournament'));
        }

        // Step 4 : generate add sponsor payload
        const addSponsorPayload: {
            name: string;
            defaultSponsor?: boolean;
            SponsorImg?: string;
            accountHolderName?: string;
            accountNumber?: string;
            bankName?: string;
            IFSC_code?: string;
            accountType?: string
        } = {
            name
        };
        if (defaultSponsor === true || defaultSponsor === 'true') {
            addSponsorPayload.defaultSponsor = true;
        }
        if (accountHolderName) {
            addSponsorPayload.accountHolderName = accountHolderName;
        }
        if (accountNumber) {
            addSponsorPayload.accountNumber = accountNumber;
        }
        if (bankName) {
            addSponsorPayload.bankName = bankName;
        }
        if (IFSC_code) {
            addSponsorPayload.IFSC_code = IFSC_code;
        }
        if (accountType) {
            addSponsorPayload.accountType = accountType;
        }

        // Step 5 : Add Sponsor
        const sponsor = await sponsorModel.create({ tournamentID: tournament?._id, ...addSponsorPayload });
        if (_.isEmpty(sponsor)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Tournament Sponsor'));
        }
        // step 6 : return sponsor Payload

        return res.status(statusCodes.CREATED).json(
            success_response(
                statusCodes.CREATED,
                "Tournament Sponsor Added successfully.",
                { sponsor },
                true
            )
        );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res.status(statusCode).json(
            failed_response(
                statusCode,
                "failed to add tournament sponsor",
                { message },
                false
            )
        );
    }
});

const fetchTournamentSponsors = catchAsync(async (req, res) => {
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

        // Step 4 : fetch tournament sponsors

        let sponsors = await sponsorModel.find({ tournamentID: tournament?._id }).select('name defaultSponsor bankName updatedAt').lean();
        const defaultSponsor = sponsors.find((sponsor) => sponsor.defaultSponsor);
        sponsors = sponsors.filter((sponsor) => !sponsor?.defaultSponsor);

        const sponsorsPayload = defaultSponsor?._id ? [defaultSponsor, ...sponsors] : sponsors;

        // step 5 : return sponsors Payload

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Successfully Fetch Tournament Sponsors",
                { sponsors: sponsorsPayload },
                true
            )
        );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res.status(statusCode).json(
            failed_response(
                statusCode,
                "failed to fetch tournament sponsors",
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
const fetchSpecificTournamentSponsor = catchAsync(async (req, res) => {
    try {
        // Step 1 : Extract Tournament id from the request
        const { sponsorId } = req.params;

        // Step 2 : Validate tournament Id

        // Validate Tournament id
        if (_.isEmpty(sponsorId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('sponsorId'));
        }
        if (!isValidObjectId(sponsorId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired('sponsorId'));
        }

        // Step 3 : Fetch sponsor
        let sponsor = await sponsorModel.findById(sponsorId).lean();

        if (_.isEmpty(sponsor)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Sponsor'));
        }

        // step 4 : return sponsors Payload

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Successfully Fetch Tournament Sponsor",
                { sponsor },
                true
            )
        );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res.status(statusCode).json(
            failed_response(
                statusCode,
                "failed to fetch tournament sponsor",
                { message },
                false
            )
        );
    }
});

const editSpecificTournamentSponsor = catchAsync(async (req, res) => {
    try {
        // Step 1 : Extract the sponsor details and sponsor id
        const { sponsorId } = req.params;
        const { name, defaultSponsor, accountHolderName, accountNumber, bankName, IFSC_code, accountType } = req.body;

        // Step 2 : Validate the sponsor details and sponsor Id
        // Validate sponsor id
        if (_.isEmpty(sponsorId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('tournamentID'));
        }
        if (!isValidObjectId(sponsorId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired('sponsorId'));
        }

        // Validate sponsor details
        if (_.isEmpty(name)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('sponsor name'));
        }
        if (!_.isEmpty(accountType) && !['saving', 'current'].includes(accountType?.toLowerCase())) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.invalidField('accountType, it must be saving or current'));
        }


        // Step 3 : generate add sponsor payload
        const addSponsorPayload: {
            name: string;
            defaultSponsor?: boolean;
            SponsorImg?: string;
            accountHolderName?: string;
            accountNumber?: string;
            bankName?: string;
            IFSC_code?: string;
            accountType?: string
        } = {
            name
        };
        if (defaultSponsor === true || defaultSponsor === 'true') {
            addSponsorPayload.defaultSponsor = true;
        }
        if (accountHolderName) {
            addSponsorPayload.accountHolderName = accountHolderName;
        }
        if (accountNumber) {
            addSponsorPayload.accountNumber = accountNumber;
        }
        if (bankName) {
            addSponsorPayload.bankName = bankName;
        }
        if (IFSC_code) {
            addSponsorPayload.IFSC_code = IFSC_code;
        }
        if (accountType) {
            addSponsorPayload.accountType = accountType;
        }

        // Step 4 : fetch Sponsor
        const sponsor = await sponsorModel.exists({ _id: sponsorId });
        if (_.isEmpty(sponsor)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Tournament Sponsor'));
        }

        await sponsorModel.updateOne(
            { _id: sponsor?._id },
            { $set: addSponsorPayload }
        )
        // step 5 : return sponsor Payload

        return res.status(statusCodes.CREATED).json(
            success_response(
                statusCodes.CREATED,
                "Tournament Sponsor Updated successfully.",
                { sponsor },
                true
            )
        );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res.status(statusCode).json(
            failed_response(
                statusCode,
                "failed to edit tournament sponsor",
                { message },
                false
            )
        );
    }
});

const removeTournamentSponsor = catchAsync(async (req, res) => {
    try {
        // Step 1 : Extract sponsorId from params
        const { sponsorId } = req.params;

        // Step 2 : Validate sponsor Id
        if (_.isEmpty(sponsorId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('tournamentID'));
        }

        if (!isValidObjectId(sponsorId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired('sponsorId'));
        }

        // Step 3 : Check sponsor exist or not
        const sponsor = await sponsorModel.exists({ _id: sponsorId });
        if (_.isEmpty(sponsorId)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound('Sponsor'));
        }

        // Step 4 : delete Sponsor
        await sponsorModel.deleteOne({ _id: sponsor?._id });

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Tournament Sponsor Remove successfully.",
                { sponsor },
                true
            )
        );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res.status(statusCode).json(
            failed_response(
                statusCode,
                "failed to remove tournament sponsor",
                { message },
                false
            )
        );
    }
});


const sponsorController = {
    addSponsorIntoTournament,
    fetchTournamentSponsors,
    fetchSpecificTournamentSponsor,
    editSpecificTournamentSponsor,
    removeTournamentSponsor
}

export default sponsorController;