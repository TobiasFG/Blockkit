-- Baseline schema, generated from prisma/schema.prisma via:
--   prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script
-- Supersedes the earlier align_reusable_block_versions and
-- add_trash_deleted_markers patches, which are folded in here.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "pages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "draft_version_id" UUID,
    "published_version_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "page_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "parent_page_id" UUID,
    "url_name" TEXT,
    "path_segment" TEXT,
    "content" JSONB NOT NULL,
    "meta" JSONB,
    "parent_id" UUID,
    "revision" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(6),

    CONSTRAINT "page_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "block_folders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "parent_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "block_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reusable_blocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "draft_version_id" UUID,
    "published_version_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "reusable_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reusable_block_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reusable_block_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "folder_id" UUID,
    "block_type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "parent_id" UUID,
    "revision" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(6),

    CONSTRAINT "reusable_block_versions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_draft_version_id_fkey" FOREIGN KEY ("draft_version_id") REFERENCES "page_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_published_version_id_fkey" FOREIGN KEY ("published_version_id") REFERENCES "page_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_versions" ADD CONSTRAINT "page_versions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_versions" ADD CONSTRAINT "page_versions_parent_page_id_fkey" FOREIGN KEY ("parent_page_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_versions" ADD CONSTRAINT "page_versions_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "page_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "block_folders" ADD CONSTRAINT "block_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "block_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reusable_blocks" ADD CONSTRAINT "reusable_blocks_draft_version_id_fkey" FOREIGN KEY ("draft_version_id") REFERENCES "reusable_block_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reusable_blocks" ADD CONSTRAINT "reusable_blocks_published_version_id_fkey" FOREIGN KEY ("published_version_id") REFERENCES "reusable_block_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reusable_block_versions" ADD CONSTRAINT "reusable_block_versions_reusable_block_id_fkey" FOREIGN KEY ("reusable_block_id") REFERENCES "reusable_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reusable_block_versions" ADD CONSTRAINT "reusable_block_versions_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "block_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reusable_block_versions" ADD CONSTRAINT "reusable_block_versions_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "reusable_block_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
