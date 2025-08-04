/*
  Warnings:

  - You are about to alter the column `estimated_cost` on the `campaigns` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,4)` to `Integer`.
  - You are about to alter the column `actual_cost` on the `campaigns` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,4)` to `Integer`.
  - You are about to drop the column `base_zns_cost` on the `message_charges` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `message_charges` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,4)` to `Integer`.
  - You are about to alter the column `delivery_fee` on the `message_charges` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,4)` to `Integer`.
  - You are about to alter the column `platform_fee` on the `message_charges` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,4)` to `Integer`.
  - You are about to alter the column `vat_amount` on the `message_charges` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,4)` to `Integer`.
  - You are about to alter the column `amount` on the `refund_transactions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,4)` to `Integer`.
  - You are about to alter the column `amount` on the `subscription_charges` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,4)` to `Integer`.
  - You are about to drop the column `available_balance` on the `tenants` table. All the data in the column will be lost.
  - You are about to alter the column `balance` on the `tenants` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,4)` to `Integer`.
  - You are about to alter the column `amount` on the `topup_transactions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,4)` to `Integer`.
  - You are about to drop the column `cost_per_message` on the `zns_templates` table. All the data in the column will be lost.
  - Added the required column `creator_id` to the `api_keys` table without a default value. This is not possible if the table is not empty.
  - Added the required column `base_zns_fee` to the `message_charges` table without a default value. This is not possible if the table is not empty.
  - Added the required column `preview_url` to the `zns_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `zns_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `template_tag` to the `zns_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeout` to the `zns_templates` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."api_keys" ADD COLUMN     "creator_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "public"."campaigns" ALTER COLUMN "estimated_cost" SET DEFAULT 0,
ALTER COLUMN "estimated_cost" SET DATA TYPE INTEGER,
ALTER COLUMN "actual_cost" SET DEFAULT 0,
ALTER COLUMN "actual_cost" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "public"."message_charges" DROP COLUMN "base_zns_cost",
ADD COLUMN     "base_zns_fee" INTEGER NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE INTEGER,
ALTER COLUMN "delivery_fee" SET DATA TYPE INTEGER,
ALTER COLUMN "platform_fee" SET DATA TYPE INTEGER,
ALTER COLUMN "vat_amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "public"."refund_transactions" ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "public"."subscription_charges" ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "public"."tenants" DROP COLUMN "available_balance",
ALTER COLUMN "balance" SET DEFAULT 0,
ALTER COLUMN "balance" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "public"."topup_transactions" ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "public"."zns_templates" DROP COLUMN "cost_per_message",
ADD COLUMN     "preview_url" TEXT NOT NULL,
ADD COLUMN     "price" INTEGER NOT NULL,
ADD COLUMN     "template_quality" TEXT,
ADD COLUMN     "template_tag" TEXT NOT NULL,
ADD COLUMN     "timeout" INTEGER NOT NULL,
ALTER COLUMN "template_params" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."api_keys" ADD CONSTRAINT "api_keys_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
