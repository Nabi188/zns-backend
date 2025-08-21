/*
  Warnings:

  - The values [draft,running,completed,failed] on the enum `CampaignStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [fast,normal,batch] on the enum `DeliverySpeed` will be removed. If these variants are still used in the database, this will fail.
  - The values [pending,sent,delivered,failed] on the enum `MessageStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [admin,staff,finance] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - The values [active,canceled,expired] on the enum `SubscriptionStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [confirmed,failed,cancelled] on the enum `TransactionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."CampaignStatus_new" AS ENUM ('DRAFT', 'RUNNING', 'COMPLETED', 'FAILED');
ALTER TABLE "public"."campaigns" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."campaigns" ALTER COLUMN "status" TYPE "public"."CampaignStatus_new" USING ("status"::text::"public"."CampaignStatus_new");
ALTER TYPE "public"."CampaignStatus" RENAME TO "CampaignStatus_old";
ALTER TYPE "public"."CampaignStatus_new" RENAME TO "CampaignStatus";
DROP TYPE "public"."CampaignStatus_old";
ALTER TABLE "public"."campaigns" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."DeliverySpeed_new" AS ENUM ('FAST', 'NORMAL', 'BATCH');
ALTER TABLE "public"."message_logs" ALTER COLUMN "delivery_speed" TYPE "public"."DeliverySpeed_new" USING ("delivery_speed"::text::"public"."DeliverySpeed_new");
ALTER TYPE "public"."DeliverySpeed" RENAME TO "DeliverySpeed_old";
ALTER TYPE "public"."DeliverySpeed_new" RENAME TO "DeliverySpeed";
DROP TYPE "public"."DeliverySpeed_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."MessageStatus_new" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');
ALTER TABLE "public"."message_logs" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."message_logs" ALTER COLUMN "status" TYPE "public"."MessageStatus_new" USING ("status"::text::"public"."MessageStatus_new");
ALTER TYPE "public"."MessageStatus" RENAME TO "MessageStatus_old";
ALTER TYPE "public"."MessageStatus_new" RENAME TO "MessageStatus";
DROP TYPE "public"."MessageStatus_old";
ALTER TABLE "public"."message_logs" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."Role_new" AS ENUM ('OWNER', 'ADMIN', 'STAFF', 'FINANCE');
ALTER TABLE "public"."tenant_members" ALTER COLUMN "role" TYPE "public"."Role_new" USING ("role"::text::"public"."Role_new");
ALTER TYPE "public"."Role" RENAME TO "Role_old";
ALTER TYPE "public"."Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."SubscriptionStatus_new" AS ENUM ('ACTIVE', 'CANCELED', 'EXPIRED');
ALTER TABLE "public"."subscriptions" ALTER COLUMN "status" TYPE "public"."SubscriptionStatus_new" USING ("status"::text::"public"."SubscriptionStatus_new");
ALTER TYPE "public"."SubscriptionStatus" RENAME TO "SubscriptionStatus_old";
ALTER TYPE "public"."SubscriptionStatus_new" RENAME TO "SubscriptionStatus";
DROP TYPE "public"."SubscriptionStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."TransactionStatus_new" AS ENUM ('CONFIRMED', 'FAILED', 'CANCELLED');
ALTER TABLE "public"."message_charges" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."refund_transactions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."subscription_charges" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."topup_transactions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."subscription_charges" ALTER COLUMN "status" TYPE "public"."TransactionStatus_new" USING ("status"::text::"public"."TransactionStatus_new");
ALTER TABLE "public"."message_charges" ALTER COLUMN "status" TYPE "public"."TransactionStatus_new" USING ("status"::text::"public"."TransactionStatus_new");
ALTER TABLE "public"."topup_transactions" ALTER COLUMN "status" TYPE "public"."TransactionStatus_new" USING ("status"::text::"public"."TransactionStatus_new");
ALTER TABLE "public"."refund_transactions" ALTER COLUMN "status" TYPE "public"."TransactionStatus_new" USING ("status"::text::"public"."TransactionStatus_new");
ALTER TYPE "public"."TransactionStatus" RENAME TO "TransactionStatus_old";
ALTER TYPE "public"."TransactionStatus_new" RENAME TO "TransactionStatus";
DROP TYPE "public"."TransactionStatus_old";
ALTER TABLE "public"."message_charges" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';
ALTER TABLE "public"."refund_transactions" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';
ALTER TABLE "public"."subscription_charges" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';
ALTER TABLE "public"."topup_transactions" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';
COMMIT;

-- AlterTable
ALTER TABLE "public"."campaigns" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "public"."message_charges" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';

-- AlterTable
ALTER TABLE "public"."message_logs" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "public"."refund_transactions" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';

-- AlterTable
ALTER TABLE "public"."subscription_charges" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';

-- AlterTable
ALTER TABLE "public"."topup_transactions" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';

-- AlterTable
ALTER TABLE "public"."zns_templates" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';
