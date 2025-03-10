import { NextFunction, Request, Response } from 'express';
import { failed_response, success_response } from '../utils/response.js';
import _ from "lodash";
import AppError from '../utils/appError.js';
import statusCodes from '../constants/statusCodes.js';
import catchErrorMsgAndStatusCode from '../utils/catchError.js';
import { verifyToken } from '../utils/jwt.js';
import sessionModel from '../models/session.model.js';
import GlobalUserModel from '../models/globalUsers.model.js';
import AppErrorCode from '../constants/appErrorCode.js';
import userRoleModel from '../models/userRole.model.js';
// import catchAsync from '../utils/catchAsync.js';
// import { userRoleDocument } from '../models/userRole.model.js';


const getAuthToken = (req: Request, res: Response, next: NextFunction): void => {
    console.log("request : ");
    if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
        req.authToken = req.headers.authorization.split(" ")[1];
    } else {
        req.authToken = null;
    }
    next();
}

const auth = (req: Request, res: Response, next: NextFunction) => {
    getAuthToken(req, res, async () => {
        try {
            const { authToken } = req;
            // 1. verify access token and validate
            if (!authToken) {
                throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.MissingAuthToken);
            }
            console.log("token : ", authToken);
            const { payload } = verifyToken(authToken);
            console.log("payload : ", payload);

            if (_.isEmpty(payload)) {
                throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.InvalidAccessToken);
            }
            // 2. Check user session Expired or not.
            const userSession = await sessionModel.findById(payload.sessionId).lean();
            const now = Date.now();
            if (_.isEmpty(userSession) || userSession?.expiresAt.getTime() < now) {
                throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.SessionExpired);
            }

            // 3. fetch user or not
            const currentUser = await GlobalUserModel.findOne({ userMongoId: payload.userId }).lean();

            if (_.isEmpty(currentUser)) {
                throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.UserNotExist);
            }

            req.currentUser = currentUser;
            // req.currentUser['userRole'] = currentUser.userRole?._id as mongoose.Schema.Types.ObjectId;
            console.log("user : ", req.currentUser);
            next();
        } catch (error) {
            const { statusCode, message } = catchErrorMsgAndStatusCode(error);
            return res.status(statusCode).json(
                failed_response(
                    statusCode,
                    "User Authentication Failed.",
                    {
                        message
                    },
                    false
                )
            );
        }
    });
};


const getUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // 1. Get User Role 
        const userRoleId = req.currentUser?.userRole;
        if (_.isEmpty(userRoleId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.UserNotExist);
        }
        const userRole = await userRoleModel.findById(userRoleId).lean();
        if (_.isEmpty(userRole)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.userRoleNotFound);
        }
        // 2. Add User Role in Request
        req.userRole = userRole;
        console.log("role : ", req.userRole);
        next();
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        res.status(statusCode).json(
            failed_response(
                statusCode,
                "Failed to Find User Role",
                {
                    message
                },
                false
            )
        );
    }
}
const verifyAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    auth(req, res, async () => {
        getUserRole(req, res, async () => {
            try {
                console.log("user Role : ", req.userRole);
                req.authId = req?.userRole?.userMongoId;
                if (req.userRole?.role?.admin || req.userRole?.role?.subAdmin?.type) {
                    next();
                } else {
                    throw new AppError(statusCodes.UNAUTHORIZED, "You are not Authorized.");
                }
                // res.status(statusCodes.ACCEPTED).json(
                //     success_response(
                //         statusCodes.ACCEPTED,
                //         "Verified successfully.",
                //         { userRole: req.userRole, user: req.currentUser },
                //         true
                //     )
                // );
            } catch (error) {
                const { statusCode, message } = catchErrorMsgAndStatusCode(error);
                res.status(statusCode).json(
                    failed_response(
                        statusCode,
                        "Failed to Verify Admin",
                        {
                            message
                        },
                        false
                    )
                );
            }
        })
    })
}



const verifySubAdmin = (...permissions: string[]) => (async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    auth(req, res, async () => {
        getUserRole(req, res, async () => {
            try {
                console.log("in verify request : ", permissions, req.currentUser, req.userRole);
                req.authId = req?.userRole?.userMongoId;
                if (req?.userRole?.role?.admin || req?.userRole?.role?.subAdmin?.type) {
                    // ADMIN HAS ACCESS TO ALL PATHS
                    if (req?.userRole?.role?.admin) {
                        return next();
                    }
                    // SUBS HAVE ACCESS TO CERTAIN PATHS
                    if (
                        permissions.some((permission) =>
                            req?.userRole?.role?.subAdmin?.permissions.includes(permission)
                        )
                    ) {
                        return next();
                    }
                } else {
                    // for user and others
                    throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode?.YouAreNotAuthorized);
                }
            } catch (error) {
                const { statusCode, message } = catchErrorMsgAndStatusCode(error);
                res.status(statusCode).json(
                    failed_response(
                        statusCode,
                        "Failed to Verify Sub Admin",
                        {
                            message
                        },
                        false
                    )
                );
            }
        })
    });
});
const verifyUserAccess = (permission: string) => (async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    auth(req, res, async () => {
        getUserRole(req, res, async () => {
            try {
                console.log("in verify request : ", permission, req.currentUser, req.userRole);
                req.authId = req?.userRole?.userMongoId;
                if (req?.userRole?.role?.admin) {
                    next();
                } else if (req?.userRole?.role?.subAdmin?.type) {
                    if (permission) {
                        const permitted = req?.userRole?.role?.subAdmin?.permissions;

                        // Check if the subAdmin has at least one of the required permissions
                        const hasPermission = permitted.includes(permission);
                        if (!hasPermission) {
                            throw new AppError(statusCodes.UNAUTHORIZED, "You Are not authorized.");
                        }
                        next();
                    }
                } else if (req?.userRole?.role?.organizer) {
                    next();
                } else if (req?.userRole?.role?.subordinate) {
                    req.subordinateID = req?.userRole?.userMongoId;
                    next();
                } else {
                    // for user
                    throw new AppError(statusCodes.UNAUTHORIZED, "You Are not authorized.");
                }
            } catch (error) {
                const { statusCode, message } = catchErrorMsgAndStatusCode(error);
                res.status(statusCode).json(
                    failed_response(
                        statusCode,
                        "Failed to Verify User Access",
                        {
                            message
                        },
                        false
                    )
                );
            }
        })
    });
});


export {
    auth,
    getUserRole,
    verifyAdmin,
    verifySubAdmin,
    verifyUserAccess
};
