import { validationResult } from "express-validator";
import { ErrorResponse } from "../response/error/ErrorResponse";
import { Request, Response } from "express-serve-static-core";

class InputValidation {
  public static inputValidate(req: Request, res: Response<ErrorResponse>) {
    const error = validationResult(req);

    console.log(req.body);

    const err = new ErrorResponse(
      "invalid data input",
      "error",
      422,
      error.array()
    );

    console.log("validatooooooooooooooooorrrrrrr.....");
    if (!error.isEmpty()) return res.status(422).json(err);
  }
}

export default InputValidation;
