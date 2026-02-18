ALTER TABLE "orders" ADD COLUMN "tracking_number" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "carrier_code" varchar(50);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "inventory_count" integer;