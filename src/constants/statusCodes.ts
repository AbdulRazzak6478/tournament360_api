/**
 * An object representing common HTTP status codes.
 * 
 * @property {number} OK - 200: The request has succeeded.
 * @property {number} CREATED - 201: The request has been fulfilled and has resulted in one or more new resources being created.
 * @property {number} ACCEPTED - 202: The request has been accepted for processing, but the processing has not been completed.
 * @property {number} NO_CONTENT - 204: The server has successfully fulfilled the request and there is no additional content to send.
 * @property {number} MOVED_PERMANENTLY - 301: The requested resource has been assigned a new permanent URI.
 * @property {number} FOUND - 302: The requested resource resides temporarily under a different URI.
 * @property {number} NOT_MODIFIED - 304: The resource has not been modified since the version specified by the request headers.
 * @property {number} BAD_REQUEST - 400: The server cannot or will not process the request due to a client error.
 * @property {number} UNAUTHORIZED - 401: The request requires user authentication.
 * @property {number} FORBIDDEN - 403: The server understood the request, but refuses to authorize it.
 * @property {number} NOT_FOUND - 404: The server has not found anything matching the request URI.
 * @property {number} METHOD_NOT_ALLOWED - 405: The method specified in the request is not allowed for the resource identified by the request URI.
 * @property {number} CONFLICT - 409: The request could not be completed due to a conflict with the current state of the resource.
 * @property {number} INTERNAL_SERVER_ERROR - 500: The server encountered an unexpected condition that prevented it from fulfilling the request.
 * @property {number} NOT_IMPLEMENTED - 501: The server does not support the functionality required to fulfill the request.
 * @property {number} BAD_GATEWAY - 502: The server, while acting as a gateway or proxy, received an invalid response from the upstream server.
 * @property {number} SERVICE_UNAVAILABLE - 503: The server is currently unable to handle the request due to temporary overloading or maintenance.
 * @property {number} GATEWAY_TIMEOUT - 504: The server, while acting as a gateway or proxy, did not receive a timely response from the upstream server.
 */
const statusCodes = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    MOVED_PERMANENTLY: 301,
    FOUND: 302,
    NOT_MODIFIED: 304,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504
};
export type httpStatusCodeType = typeof statusCodes.OK |
    typeof statusCodes.CREATED |
    typeof statusCodes.ACCEPTED |
    typeof statusCodes.NO_CONTENT |
    typeof statusCodes.MOVED_PERMANENTLY |
    typeof statusCodes.FOUND |
    typeof statusCodes.NOT_MODIFIED |
    typeof statusCodes.BAD_REQUEST |
    typeof statusCodes.UNAUTHORIZED |
    typeof statusCodes.FORBIDDEN |
    typeof statusCodes.NOT_FOUND |
    typeof statusCodes.METHOD_NOT_ALLOWED |
    typeof statusCodes.CONFLICT |
    typeof statusCodes.TOO_MANY_REQUESTS |
    typeof statusCodes.INTERNAL_SERVER_ERROR |
    typeof statusCodes.NOT_IMPLEMENTED |
    typeof statusCodes.BAD_GATEWAY |
    typeof statusCodes.SERVICE_UNAVAILABLE |
    typeof statusCodes.GATEWAY_TIMEOUT ;

export default statusCodes;