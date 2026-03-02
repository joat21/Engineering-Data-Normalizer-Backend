import { Readable } from "node:stream";
import crypto from "node:crypto";

export const calculateHashAsync = (buffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = Readable.from(buffer);

    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", (err) => reject(err));
  });
};
