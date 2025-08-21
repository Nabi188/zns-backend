/*
  Warnings:

  - You are about to drop the column `owner_id` on the `tenants` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."tenants" DROP CONSTRAINT "tenants_owner_id_fkey";

-- AlterTable
ALTER TABLE "public"."tenants" DROP COLUMN "owner_id";
