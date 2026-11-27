CREATE TYPE "public"."estado_pedido" AS ENUM('pendiente', 'confirmado', 'en_preparacion', 'en_camino', 'entregado', 'cancelado');--> statement-breakpoint
CREATE TABLE "ajustes" (
	"clave" text PRIMARY KEY NOT NULL,
	"valor" text NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notificaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" text NOT NULL,
	"pedido_id" uuid,
	"leida" boolean DEFAULT false NOT NULL,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedido_historial" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid NOT NULL,
	"estado" "estado_pedido" NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"usuario_id" uuid
);
--> statement-breakpoint
CREATE TABLE "pedido_lineas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid NOT NULL,
	"producto_id" uuid,
	"slug" text NOT NULL,
	"nombre" text NOT NULL,
	"marca" text NOT NULL,
	"tamano" text NOT NULL,
	"precio_usd" numeric(10, 2) NOT NULL,
	"cantidad" integer NOT NULL,
	CONSTRAINT "pedido_lineas_cantidad_positiva" CHECK ("pedido_lineas"."cantidad" > 0)
);
--> statement-breakpoint
CREATE TABLE "pedidos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" serial NOT NULL,
	"usuario_id" uuid NOT NULL,
	"estado" "estado_pedido" DEFAULT 'pendiente' NOT NULL,
	"total_usd" numeric(12, 2) NOT NULL,
	"clave_idempotencia" text NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pedidos_numero_unique" UNIQUE("numero"),
	CONSTRAINT "pedidos_clave_idempotencia_unique" UNIQUE("clave_idempotencia")
);
--> statement-breakpoint
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido_historial" ADD CONSTRAINT "pedido_historial_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido_historial" ADD CONSTRAINT "pedido_historial_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido_lineas" ADD CONSTRAINT "pedido_lineas_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido_lineas" ADD CONSTRAINT "pedido_lineas_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notificaciones_leida_idx" ON "notificaciones" USING btree ("leida","creada_en");--> statement-breakpoint
CREATE INDEX "pedido_historial_pedido_idx" ON "pedido_historial" USING btree ("pedido_id");--> statement-breakpoint
CREATE INDEX "pedido_lineas_pedido_idx" ON "pedido_lineas" USING btree ("pedido_id");--> statement-breakpoint
CREATE INDEX "pedidos_usuario_idx" ON "pedidos" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "pedidos_estado_idx" ON "pedidos" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "pedidos_creado_idx" ON "pedidos" USING btree ("creado_en");