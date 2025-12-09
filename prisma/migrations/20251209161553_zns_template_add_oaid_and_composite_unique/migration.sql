/*
  Warnings:

  - Added the required column `oa_id` to the `zns_templates` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."zns_templates" ADD COLUMN     "oa_id" TEXT NOT NULL,
ALTER COLUMN "price" SET DEFAULT 0;
