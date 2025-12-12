/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,tracking_id]` on the table `message_logs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."message_logs" ALTER COLUMN "recipient_zalo_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "message_logs_tenant_id_tracking_id_key" ON "public"."message_logs"("tenant_id", "tracking_id");
