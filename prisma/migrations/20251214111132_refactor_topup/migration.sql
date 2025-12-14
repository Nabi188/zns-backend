/*
  Warnings:

  - A unique constraint covering the columns `[payment_ref]` on the table `topup_transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "topup_transactions_payment_ref_key" ON "public"."topup_transactions"("payment_ref");
