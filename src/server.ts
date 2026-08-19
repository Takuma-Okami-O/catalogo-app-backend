// IMPORTANTE: esta línea debe ser la PRIMERA de todo el archivo.
// Carga el contenido de .env dentro de process.env antes de que cualquier
// otro módulo (como validateEnv() más abajo) intente leerlo.
import "dotenv/config";

import express from "express";
import { buildAuthRoutes } from "./infrastructure/http/routes/authRoutes";
import { buildCatalogRoutes } from "./infrastructure/http/routes/catalogRoutes";
import { buildPublicCatalogPageRoute } from "./infrastructure/http/routes/publicCatalogPageRoute";
import { JwtTokenService } from "./infrastructure/services/JwtTokenService";
import { globalErrorHandler, notFoundHandler } from "./infrastructure/http/middlewares/globalErrorHandler";
import { InMemoryStoreRepository, InMemoryProductRepository, InMemoryOrderRepository, InMemoryStoreVisitRepository, InMemoryPremiumCodeRepository } from "./infrastructure/services/InMemoryCatalogRepositories";

const REQUIRED_ENV_VARS = ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"] as const;

function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno obligatorias: ${missing.join(", ")}`);
  }
}

validateEnv();

const app = express();
app.use(express.json());

const jwtConfig = {
  accessSecret: process.env.JWT_ACCESS_SECRET as string,
  refreshSecret: process.env.JWT_REFRESH_SECRET as string,
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
};

const sharedTokenService = new JwtTokenService(jwtConfig);

async function bootstrap() {
  if (process.env.DATABASE_URL) {
    // Producción: Prisma + PostgreSQL real. Import dinámico para no
    // requerir @prisma/client generado cuando se corre solo con memoria.
    // eslint-disable-next-line no-console
    console.log("Conectando a PostgreSQL vía Prisma...");
    const { PrismaClient } = await import("@prisma/client");
    const { PrismaUserRepository } = await import("./infrastructure/services/PrismaUserRepository");
    const {
      PrismaStoreRepository,
      PrismaProductRepository,
      PrismaOrderRepository,
      PrismaStoreVisitRepository,
      PrismaPremiumCodeRepository,
    } = await import("./infrastructure/services/PrismaCatalogRepositories");

    const prisma = new PrismaClient();
    await prisma.$connect();

    const storeRepository = new PrismaStoreRepository(prisma);
    const productRepository = new PrismaProductRepository(prisma);
    const orderRepository = new PrismaOrderRepository(prisma);
    const visitRepository = new PrismaStoreVisitRepository(prisma);
    const codeRepository = new PrismaPremiumCodeRepository(prisma);

    app.use("/api/auth", buildAuthRoutes(jwtConfig, new PrismaUserRepository(prisma)));
    app.use(
      "/api",
      buildCatalogRoutes(sharedTokenService, { storeRepository, productRepository, orderRepository, visitRepository, codeRepository })
    );
    app.use(buildPublicCatalogPageRoute(storeRepository, productRepository, visitRepository));
  } else {
    // Desarrollo local sin BD montada: repos en memoria (se reinician al reiniciar el server).
    // eslint-disable-next-line no-console
    console.log("DATABASE_URL no configurada: usando repositorios en memoria (solo desarrollo).");
    const storeRepository = new InMemoryStoreRepository();
    const productRepository = new InMemoryProductRepository();
    const orderRepository = new InMemoryOrderRepository();
    const visitRepository = new InMemoryStoreVisitRepository();
    const codeRepository = new InMemoryPremiumCodeRepository();

    app.use("/api/auth", buildAuthRoutes(jwtConfig));
    app.use(
      "/api",
      buildCatalogRoutes(sharedTokenService, { storeRepository, productRepository, orderRepository, visitRepository, codeRepository })
    );
    app.use(buildPublicCatalogPageRoute(storeRepository, productRepository, visitRepository));
  }

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  const PORT = process.env.PORT ?? 3000;
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Servidor escuchando en el puerto ${PORT}`);
  });
}

bootstrap();

export { app };
