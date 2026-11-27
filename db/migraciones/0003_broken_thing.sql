CREATE TABLE "tasas_cambio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cup_por_usd" numeric(12, 2) NOT NULL,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL,
	"usuario_id" uuid,
	CONSTRAINT "tasas_cambio_positiva" CHECK ("tasas_cambio"."cup_por_usd" > 0)
);
--> statement-breakpoint
ALTER TABLE "tasas_cambio" ADD CONSTRAINT "tasas_cambio_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tasas_cambio_creada_idx" ON "tasas_cambio" USING btree ("creada_en");