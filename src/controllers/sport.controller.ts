import statusCodes from "../constants/status-codes.constant.js";
import Sport from "../models/sport.model.js";
import AppError from "../utils/app-error.util.js";
import catchAsync from "../utils/catch-async.util.js";
import catchErrorMsgAndStatusCode from "../utils/catch-error.util.js";
import { failed_response, success_response } from "../utils/response.util.js";
import _ from "lodash";

const createSport = catchAsync(async (req, res) => {

    try {
        // 1. validate data for sport
        const { sportName } = req.body;
        if (_.isEmpty(sportName)) {
            throw new AppError(statusCodes.NOT_FOUND, "sportName is required.");
        }
        // 2. check this sport is already exist or not
        const sports = await Sport.find({}, { name: 1, sportID: 1 }).lean();
        console.log("sports : ", sports);
        const isSportExist = sports?.filter((sport) => sport?.name?.toLowerCase() === sportName?.toLowerCase());
        if (!_.isEmpty(isSportExist)) {
            throw new AppError(statusCodes.BAD_REQUEST, "Sport Already Added!");
        }
        // 3. create payload
        const newId = `SPT${(sports.length + 1).toString().padStart(3, "0")}`;
        const sportPayload = {
            name: sportName,
            sportID: newId,
        }
        // 4. create sport
        const newSport = await Sport.create(sportPayload);
        if (_.isEmpty(newSport)) {
            throw new AppError(statusCodes.BAD_REQUEST, "Not able to Add New Sport.");
        }
        // 5. return response
        return res.status(statusCodes.CREATED).json(
            success_response(
                statusCodes.CREATED,
                "New Sport Added",
                { newSport },
                true
            )
        )
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error)
        console.log("Error in Create Sport : ", message);
        return res.status(statusCode).json(
            failed_response(
                statusCode,
                "Failed to add new Sport",
                {
                    message
                },
                false
            )
        )
    }
});
const getSports = catchAsync(async (req, res) => {

    try {

        const sports = await Sport.find({}).lean();

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Get All Sports Successfully.",
                { sports, length: sports?.length },
                true
            )
        )
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error)
        console.log("Error in fetching Sports : ", message);
        return res.status(statusCode).json(
            failed_response(
                statusCode,
                "Failed to get Sports",
                {
                    message
                },
                false
            )
        )
    }
});
const editSport = catchAsync(async (req, res) => {

    try {
        const { sportID, sportName } = req.body;
        if (_.isEmpty(sportID)) {
            throw new AppError(statusCodes.BAD_REQUEST, "sportID is required.");
        }
        if (_.isEmpty(sportName)) {
            throw new AppError(statusCodes.BAD_REQUEST, "sportName is required.");
        }

        const sports = await Sport.find({ name: { $regex: sportName, $options: "i" } }).lean();
        if (sports?.length > 1) {
            throw new AppError(statusCodes.BAD_REQUEST, "Sport is Already Added.")
        }

        let sport = await Sport.findOne({ sportID });
        if (_.isEmpty(sport)) {
            throw new AppError(statusCodes.BAD_REQUEST, "Sport Not Found.")
        }
        sport.name = sportName;
        sport = await sport.save();

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Sport Name Updated!",
                { sport },
                true
            )
        )
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error)
        console.log("Error in Editing Sport Name : ", message);
        return res.status(statusCode).json(
            failed_response(
                statusCode,
                "Failed to Update Sport Name",
                {
                    message
                },
                false
            )
        )
    }
});
const updateSportStatus = catchAsync(async (req, res) => {

    try {
        const { sportID } = req.body;
        if (_.isEmpty(sportID)) {
            throw new AppError(statusCodes.BAD_REQUEST, "sportID is required.");
        }

        let sport = await Sport.findOne({ sportID });
        if (_.isEmpty(sport)) {
            throw new AppError(statusCodes.BAD_REQUEST, "Sport Not Found.")
        }
        sport.status = sport.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        sport = await sport.save();

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Sport status Updated!",
                { sport },
                true
            )
        )
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error)
        console.log("Error in updating Sport status : ", message);
        return res.status(statusCode).json(
            failed_response(
                statusCode,
                "Failed to Update Sport Status",
                {
                    message
                },
                false
            )
        )
    }
});


const sportController = {
    createSport,
    getSports,
    editSport,
    updateSportStatus
};

export default sportController;