import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "ru-central1",
  endpoint: "https://storage.yandexcloud.net",
  credentials: {
    accessKeyId: process.env.AWS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
});

export const uploadFile = async (
  file: Express.Multer.File,
  fileHash: string,
) => {
  const key = `imports/${fileHash}-${file.originalname}`;
  const bucketName = process.env.BUCKET_NAME;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  return `https://storage.yandexcloud.net/${bucketName}/${encodeURIComponent(key)}`;
};

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
