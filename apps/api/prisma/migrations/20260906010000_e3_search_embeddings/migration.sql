-- E3 search / embeddings / funding preview
CREATE TABLE "TechnologyEmbedding" (
    "id" UUID NOT NULL,
    "technologyId" UUID NOT NULL,
    "model" TEXT NOT NULL,
    "vector" JSONB NOT NULL,
    "textHash" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechnologyEmbedding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TechnologyEmbedding_technologyId_key" ON "TechnologyEmbedding"("technologyId");

CREATE TABLE "ChallengeEmbedding" (
    "id" UUID NOT NULL,
    "challengeId" UUID NOT NULL,
    "model" TEXT NOT NULL,
    "vector" JSONB NOT NULL,
    "textHash" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallengeEmbedding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChallengeEmbedding_challengeId_key" ON "ChallengeEmbedding"("challengeId");

CREATE TABLE "ProjectEmbedding" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "model" TEXT NOT NULL,
    "vector" JSONB NOT NULL,
    "textHash" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectEmbedding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectEmbedding_projectId_key" ON "ProjectEmbedding"("projectId");

CREATE TABLE "FunderProfile" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "country" TEXT,
    "region" TEXT,
    "organizationId" UUID,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FunderProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FunderProfile_slug_key" ON "FunderProfile"("slug");
CREATE INDEX "FunderProfile_status_idx" ON "FunderProfile"("status");
CREATE INDEX "FunderProfile_country_idx" ON "FunderProfile"("country");
CREATE INDEX "FunderProfile_region_idx" ON "FunderProfile"("region");

CREATE TABLE "FundingOffer" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "deadline" TIMESTAMP(3),
    "country" TEXT,
    "region" TEXT,
    "organizationId" UUID NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundingOffer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FundingOffer_slug_key" ON "FundingOffer"("slug");
CREATE INDEX "FundingOffer_status_idx" ON "FundingOffer"("status");
CREATE INDEX "FundingOffer_organizationId_idx" ON "FundingOffer"("organizationId");
CREATE INDEX "FundingOffer_deadline_idx" ON "FundingOffer"("deadline");

CREATE INDEX "Technology_country_idx" ON "Technology"("country");
CREATE INDEX "Technology_region_idx" ON "Technology"("region");
CREATE INDEX "Challenge_country_idx" ON "Challenge"("country");
CREATE INDEX "Challenge_region_idx" ON "Challenge"("region");
CREATE INDEX "Project_country_idx" ON "Project"("country");
CREATE INDEX "Project_region_idx" ON "Project"("region");

ALTER TABLE "TechnologyEmbedding" ADD CONSTRAINT "TechnologyEmbedding_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "Technology"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChallengeEmbedding" ADD CONSTRAINT "ChallengeEmbedding_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectEmbedding" ADD CONSTRAINT "ProjectEmbedding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FunderProfile" ADD CONSTRAINT "FunderProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FundingOffer" ADD CONSTRAINT "FundingOffer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
