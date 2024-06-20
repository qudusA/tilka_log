import ProductModel from "../../models/product";

export interface Ok {
  status: string;
  statusCode: number;
  message: string;
  data: string | {} | Array<{}>;
}
