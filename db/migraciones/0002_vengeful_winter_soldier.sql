ALTER TABLE "productos" ADD COLUMN "stock" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "productos" ADD CONSTRAINT "productos_stock_no_negativo" CHECK ("productos"."stock" >= 0);