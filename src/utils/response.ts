import _ from "lodash";

type responseParams = {
    code: number,
    message: string,
    response: object,
    status: boolean
}
const failed_response = (code: number, message: string, response: object, status: boolean): void | responseParams => {
    if (!_.isInteger(code)) {
        return console.error("Code is empty");
    }
    if (_.isEmpty(message)) {
        return console.error("message is empty");
    }
    if (!_.isObject(response)) {
        return console.error("response is not object");
    }
    if (!_.isBoolean(status)) {
        return console.error("status is empty");
    }

    const resp = {
        code: code,

        message: message,
        response: response || {},
        status: status,
    };
    return resp;
};
const success_response = (code: number, message: string, response: object, status: boolean): void | responseParams => {
    if (!_.isInteger(code)) {
        return console.error("Code is empty");
    }
    if (_.isEmpty(message)) {
        return console.error("message is empty");
    }

    if (!_.isObject(response)) {
        return console.error("response is not object");
    }
    if (!_.isBoolean(status)) {
        return console.error("status is empty");
    }

    const resp = {
        code: code,
        message: message,
        response: response,
        status: status,
    };
    return resp;
};

export { failed_response, success_response };
