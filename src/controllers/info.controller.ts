import statusCodes from "../constants/status-codes.constant.js";
import catchAsync from "../utils/catch-async.util.js";

const info = {
    name: 'Tournament360',
    version: '1.0.0',
    description: 'A platform to manage and track tournaments',
    author: 'ABDUL RAZZAK',
    license: 'MIT'
};
const payload = {
    code: 200,
    message: "Server is started",
    response: info,
    status: true
}


const InfoController = catchAsync(async (req, res) => {
    return res.status(statusCodes.OK).json(payload)
})

export default InfoController;