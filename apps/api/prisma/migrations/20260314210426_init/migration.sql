-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('YOUTUBE_SHORTS', 'INSTAGRAM_REELS');

-- CreateEnum
CREATE TYPE "ClipStatus" AS ENUM ('QUEUED', 'FETCHING_METADATA', 'EXTRACTING_TRANSCRIPT', 'SUMMARIZING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "TagSource" AS ENUM ('USER', 'AI_SUGGESTED');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('PERSON', 'PRODUCT', 'BRAND', 'PLACE', 'CONCEPT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clip" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "canonicalUrl" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "title" TEXT,
    "thumbnailUrl" TEXT,
    "authorName" TEXT,
    "authorHandle" TEXT,
    "durationSec" INTEGER,
    "transcript" TEXT,
    "summary" TEXT,
    "keyTakeaways" TEXT[],
    "status" "ClipStatus" NOT NULL DEFAULT 'QUEUED',
    "failureReason" TEXT,
    "userNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClipTag" (
    "clipId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "source" "TagSource" NOT NULL DEFAULT 'USER',

    CONSTRAINT "ClipTag_pkey" PRIMARY KEY ("clipId","tagId")
);

-- CreateTable
CREATE TABLE "Entity" (
    "id" TEXT NOT NULL,
    "clipId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EntityType" NOT NULL,

    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CollectionToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CollectionToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "Clip_userId_status_idx" ON "Clip"("userId", "status");

-- CreateIndex
CREATE INDEX "Clip_userId_createdAt_idx" ON "Clip"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Clip_userId_canonicalUrl_key" ON "Clip"("userId", "canonicalUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Entity_clipId_idx" ON "Entity"("clipId");

-- CreateIndex
CREATE INDEX "Entity_name_idx" ON "Entity"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_userId_name_key" ON "Collection"("userId", "name");

-- CreateIndex
CREATE INDEX "_CollectionToTag_B_index" ON "_CollectionToTag"("B");

-- AddForeignKey
ALTER TABLE "Clip" ADD CONSTRAINT "Clip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClipTag" ADD CONSTRAINT "ClipTag_clipId_fkey" FOREIGN KEY ("clipId") REFERENCES "Clip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClipTag" ADD CONSTRAINT "ClipTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_clipId_fkey" FOREIGN KEY ("clipId") REFERENCES "Clip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollectionToTag" ADD CONSTRAINT "_CollectionToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollectionToTag" ADD CONSTRAINT "_CollectionToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
