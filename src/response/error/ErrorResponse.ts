export class ErrorResponse extends Error {
  status: string;
  statusCode: number;
  error: any;

  constructor(message: string, status: string, statusCode: number, error: any) {
    super(message);
    this.status = status;
    this.statusCode = statusCode;
    this.error = error;
  }
}
