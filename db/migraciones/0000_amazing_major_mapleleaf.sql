CREATE TYPE "public"."estado_producto" AS ENUM('activo', 'agotado', 'descontinuado');--> statement-breakpoint
CREATE TYPE "public"."familia_olfativa" AS ENUM('citrico', 'floral', 'amaderado', 'oriental', 'frutal', 'acuatico', 'gourmand');--> statement-breakpoint
CREATE TABLE "categorias" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"marca" text NOT NULL,
	"nombre" text NOT NULL,
	"tamano" text NOT NULL,
	"tamano_ml" integer NOT NULL,
	"precio_usd" numeric(10, 2) NOT NULL,
	"descripcion" text NOT NULL,
	"notas_salida" text[] NOT NULL,
	"notas_corazon" text[] NOT NULL,
	"notas_fondo" text[] NOT NULL,
	"imagen_src" text NOT NULL,
	"imagen_alt" text NOT NULL,
	"categoria_id" text NOT NULL,
	"familia" "familia_olfativa" NOT NULL,
	"destacado" boolean DEFAULT false NOT NULL,
	"novedad" boolean DEFAULT false NOT NULL,
	"estado" "estado_producto" DEFAULT 'activo' NOT NULL,
	"oculto" boolean DEFAULT false NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categorias_slug_unique" ON "categorias" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "productos_slug_unique" ON "productos" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "productos_categoria_idx" ON "productos" USING btree ("categoria_id");--> statement-breakpoint
CREATE INDEX "productos_familia_idx" ON "productos" USING btree ("familia");--> statement-breakpoint
CREATE INDEX "productos_estado_idx" ON "productos" USING btree ("estado") WHERE oculto = false;