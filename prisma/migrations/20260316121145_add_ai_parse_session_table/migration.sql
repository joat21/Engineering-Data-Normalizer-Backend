-- CreateTable
CREATE TABLE "AiParseSession" (
    "id" UUID NOT NULL,
    "importSessionId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiParseSession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AiParseSession" ADD CONSTRAINT "AiParseSession_importSessionId_fkey" FOREIGN KEY ("importSessionId") REFERENCES "ImportSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiParseResult" ADD CONSTRAINT "AiParseResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AiParseSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
