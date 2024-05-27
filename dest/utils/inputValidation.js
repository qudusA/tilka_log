"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const ErrorResponse_1 = require("../response/error/ErrorResponse");
class InputValidation {
    static inputValidate(req, res) {
        const error = (0, express_validator_1.validationResult)(req);
        console.log(req.body);
        const err = new ErrorResponse_1.ErrorResponse("invalid data input", "error", 422, error.array());
        console.log("validatooooooooooooooooorrrrrrr.....");
        if (!error.isEmpty())
            return res.status(422).json(err);
    }
}
exports.default = InputValidation;
