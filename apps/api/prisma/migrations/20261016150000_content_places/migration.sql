CREATE TABLE "ContentPlace" (
    "id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentPlace_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContentPlace_kind_entityId_role_country_key" ON "ContentPlace"("kind", "entityId", "role", "country");
CREATE INDEX "ContentPlace_kind_entityId_idx" ON "ContentPlace"("kind", "entityId");
CREATE INDEX "ContentPlace_country_region_idx" ON "ContentPlace"("country", "region");

INSERT INTO "ContentPlace" ("id", "kind", "entityId", "role", "country", "region", "createdAt")
SELECT gen_random_uuid(), 'TECHNOLOGY', "id", 'ORIGIN', UPPER("country"), "region", CURRENT_TIMESTAMP
FROM "Technology"
WHERE "country" IS NOT NULL AND LENGTH(TRIM("country")) = 2;

INSERT INTO "ContentPlace" ("id", "kind", "entityId", "role", "country", "region", "createdAt")
SELECT gen_random_uuid(), 'CHALLENGE', "id", 'ORIGIN', UPPER("country"), "region", CURRENT_TIMESTAMP
FROM "Challenge"
WHERE "country" IS NOT NULL AND LENGTH(TRIM("country")) = 2;

INSERT INTO "ContentPlace" ("id", "kind", "entityId", "role", "country", "region", "createdAt")
SELECT gen_random_uuid(), 'FUNDING_OFFER', "id", 'ORIGIN', UPPER("country"), "region", CURRENT_TIMESTAMP
FROM "FundingOffer"
WHERE "country" IS NOT NULL AND LENGTH(TRIM("country")) = 2;

INSERT INTO "ContentPlace" ("id", "kind", "entityId", "role", "country", "region", "createdAt")
SELECT gen_random_uuid(), 'SUCCESS_CASE', "id", 'ORIGIN', UPPER("country"), "region", CURRENT_TIMESTAMP
FROM "SuccessCase"
WHERE "country" IS NOT NULL AND LENGTH(TRIM("country")) = 2;
