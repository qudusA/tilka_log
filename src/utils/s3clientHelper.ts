import { S3Client } from "@aws-sdk/client-s3";

export default new S3Client({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY as string,
    secretAccessKey: process.env.ACCESS_SECRET as string,
  },
  region: process.env.REGION as string,
});
