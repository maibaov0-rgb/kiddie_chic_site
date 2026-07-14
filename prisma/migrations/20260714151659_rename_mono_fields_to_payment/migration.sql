-- Rename payment-related columns to support multiple payment providers
ALTER TABLE "Order" RENAME COLUMN "monoInvoiceId" TO "paymentInvoiceId";
ALTER TABLE "Order" RENAME COLUMN "monoPaidAt" TO "paidAt";
