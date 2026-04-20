import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "ru-central1",
  endpoint: "https://storage.yandexcloud.net",
  credentials: {
    accessKeyId: process.env.AWS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
});

export const uploadToS3 = async (params: {
  key: string;
  body: Buffer;
  contentType: string;
}) => {
  const bucketName = process.env.BUCKET_NAME;
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType,
  });

  await s3.send(command);

  return `https://storage.yandexcloud.net/${bucketName}/${encodeURIComponent(params.key)}`;
};

export const downloadFromS3 = async (key: string) => {
  const command = new GetObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: key,
  });

  const response = await s3.send(command);
  const byteArray = await response.Body?.transformToByteArray();

  if (!byteArray) {
    throw new Error("Не удалось прочитать файл из S3");
  }

  return Buffer.from(byteArray);
};
