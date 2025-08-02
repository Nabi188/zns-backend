/*
  Warnings:

  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - Added the required column `full_name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('admin', 'staff', 'finance');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('active', 'canceled', 'expired');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('confirmed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."MessageStatus" AS ENUM ('pending', 'sent', 'delivered', 'failed');

-- CreateEnum
CREATE TYPE "public"."DeliverySpeed" AS ENUM ('fast', 'normal', 'batch');

-- CreateEnum
CREATE TYPE "public"."CampaignStatus" AS ENUM ('draft', 'running', 'completed', 'failed');

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "name",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "full_name" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "public"."tenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "owner_id" UUID NOT NULL,
    "balance" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "available_balance" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tenant_members" (
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "role" "public"."Role" NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_members_pkey" PRIMARY KEY ("user_id","tenant_id")
);

-- CreateTable
CREATE TABLE "public"."subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL,
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscription_charges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "billing_period" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'confirmed',
    "charged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."zalo_oas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "oa_id_zalo" TEXT NOT NULL,
    "oa_name" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zalo_oas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_keys" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "key_hash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."zns_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "template_id" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "cost_per_message" DECIMAL(18,4) NOT NULL,
    "template_params" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zns_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "public"."CampaignStatus" NOT NULL DEFAULT 'draft',
    "total_recipients" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "actual_cost" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."message_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "zalo_oa_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "campaign_id" UUID,
    "recipient_phone" TEXT NOT NULL,
    "recipient_zalo_id" TEXT NOT NULL,
    "tracking_id" TEXT NOT NULL,
    "msg_id" TEXT,
    "status" "public"."MessageStatus" NOT NULL DEFAULT 'pending',
    "delivery_speed" "public"."DeliverySpeed" NOT NULL,
    "template_data" JSONB NOT NULL,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."message_charges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "message_log_id" UUID NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "base_zns_cost" DECIMAL(18,4) NOT NULL,
    "delivery_fee" DECIMAL(18,4) NOT NULL,
    "platform_fee" DECIMAL(18,4) NOT NULL,
    "vat_amount" DECIMAL(18,4) NOT NULL,
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'confirmed',
    "charged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."topup_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "payment_method" TEXT NOT NULL,
    "payment_ref" TEXT,
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'confirmed',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topup_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refund_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "original_charge_id" UUID NOT NULL,
    "original_charge_type" TEXT NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'confirmed',
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refund_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscription_charges_tenant_id_billing_period_idx" ON "public"."subscription_charges"("tenant_id", "billing_period");

-- CreateIndex
CREATE UNIQUE INDEX "zalo_oas_oa_id_zalo_key" ON "public"."zalo_oas"("oa_id_zalo");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "public"."api_keys"("key_hash");

-- CreateIndex
CREATE UNIQUE INDEX "zns_templates_template_id_key" ON "public"."zns_templates"("template_id");

-- CreateIndex
CREATE INDEX "campaigns_tenant_id_status_idx" ON "public"."campaigns"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "message_logs_tracking_id_key" ON "public"."message_logs"("tracking_id");

-- CreateIndex
CREATE INDEX "message_logs_tenant_id_created_at_idx" ON "public"."message_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "message_logs_status_created_at_idx" ON "public"."message_logs"("status", "created_at");

-- CreateIndex
CREATE INDEX "message_logs_campaign_id_status_idx" ON "public"."message_logs"("campaign_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "message_charges_message_log_id_key" ON "public"."message_charges"("message_log_id");

-- CreateIndex
CREATE INDEX "message_charges_tenant_id_charged_at_idx" ON "public"."message_charges"("tenant_id", "charged_at");

-- CreateIndex
CREATE INDEX "message_charges_status_charged_at_idx" ON "public"."message_charges"("status", "charged_at");

-- CreateIndex
CREATE INDEX "topup_transactions_tenant_id_created_at_idx" ON "public"."topup_transactions"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "refund_transactions_tenant_id_processed_at_idx" ON "public"."refund_transactions"("tenant_id", "processed_at");

-- CreateIndex
CREATE INDEX "refund_transactions_original_charge_id_original_charge_type_idx" ON "public"."refund_transactions"("original_charge_id", "original_charge_type");

-- AddForeignKey
ALTER TABLE "public"."tenants" ADD CONSTRAINT "tenants_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tenant_members" ADD CONSTRAINT "tenant_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tenant_members" ADD CONSTRAINT "tenant_members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscription_charges" ADD CONSTRAINT "subscription_charges_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscription_charges" ADD CONSTRAINT "subscription_charges_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."zalo_oas" ADD CONSTRAINT "zalo_oas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_keys" ADD CONSTRAINT "api_keys_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."zns_templates" ADD CONSTRAINT "zns_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaigns" ADD CONSTRAINT "campaigns_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_logs" ADD CONSTRAINT "message_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_logs" ADD CONSTRAINT "message_logs_zalo_oa_id_fkey" FOREIGN KEY ("zalo_oa_id") REFERENCES "public"."zalo_oas"("oa_id_zalo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_logs" ADD CONSTRAINT "message_logs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."zns_templates"("template_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_logs" ADD CONSTRAINT "message_logs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_charges" ADD CONSTRAINT "message_charges_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_charges" ADD CONSTRAINT "message_charges_message_log_id_fkey" FOREIGN KEY ("message_log_id") REFERENCES "public"."message_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."topup_transactions" ADD CONSTRAINT "topup_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refund_transactions" ADD CONSTRAINT "refund_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
