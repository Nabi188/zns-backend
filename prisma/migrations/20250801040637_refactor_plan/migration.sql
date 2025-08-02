/*
  Warnings:

  - Added the required column `max_users` to the `plans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."plans" ADD COLUMN     "max_users" INTEGER NOT NULL;
