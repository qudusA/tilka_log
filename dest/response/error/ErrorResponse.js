"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorResponse = void 0;
class ErrorResponse extends Error {
    constructor(message, status, statusCode, error) {
        super(message);
        this.status = status;
        this.statusCode = statusCode;
        this.error = error;
    }
}
exports.ErrorResponse = ErrorResponse;
