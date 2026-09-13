Catálogo App — Backend

API REST multi-tenant construida con Node.js, Express y TypeScript, siguiendo Clean Architecture. Sirve tanto el API JSON para la app móvil de vendedores como la página pública del catálogo (HTML/CSS/JS servido directamente desde el backend) que ven los compradores.

(English below)

Arquitectura
src/
├── domain/           # Entidades, interfaces de repositorio, errores.
│                      Cero dependencias externas (ni Express ni Prisma).
├── application/       # Casos de uso: 1 clase = 1 acción de negocio.
│                      Reciben repositorios por inyección de dependencia.
└── infrastructure/    # Todo lo concreto: rutas Express, Prisma,
                       Cloudinary/Resend, JWT, middlewares.

Los casos de uso dependen de interfaces (IStoreRepository, IUserRepository, etc.), nunca de implementaciones concretas. Esto permite que los tests usen repositorios en memoria (InMemoryStoreRepository) sin tocar la base de datos real, y que server.ts inyecte las implementaciones de Prisma solo en producción.

Stack
Runtime: Node.js + TypeScript
Framework: Express
Base de datos: PostgreSQL (Neon) vía Prisma ORM
Auth: JWT (access + refresh tokens), bcrypt para hashing
Medios: Cloudinary
Email: Resend
IA: Google Gemini (agente de ventas conversacional en el catálogo)
Testing: Jest, ts-jest — 18 suites de tests
Despliegue: Render
Endpoints principales
Método	Ruta	Descripción
POST	/api/auth/register	Registro de vendedor
POST	/api/auth/login	Login + emisión de tokens
POST	/api/auth/refresh	Renovación de access token
GET	/api/stores/me	Tienda + productos del vendedor autenticado
POST	/api/stores	Creación de tienda (paso 2 del registro)
POST/PATCH/DELETE	/api/stores/:id/products | /api/products/:id	CRUD de productos
GET	/api/catalogo/:slug	Catálogo público (JSON)
GET	/catalogo/:slug	Catálogo público (página HTML completa)
POST	/api/catalogo/:slug/pedidos	Crear pedido → genera link de WhatsApp
GET	/api/stores/me/stats	Estadísticas de visitas y pedidos

Rutas de super-admin (/api/admin/*) protegidas por rol ADMIN en el JWT.

Decisiones técnicas destacadas
Multi-tenancy por slug único, con la verificación de propiedad (requesterId vs. dueño real de la tienda/producto) resuelta dentro de cada caso de uso, no delegada a un middleware genérico — así cada caso de uso es explícito sobre sus propias reglas de autorización.
Manejo de errores centralizado vía globalErrorHandler + clases de error de dominio (ValidationError, ForbiddenError, ProductLimitExceededError, etc.) que ya traen el mensaje listo para mostrarse al usuario final, sin filtrar detalles internos.
Timeout configurable por request en el cliente (ver repo de vendedor-app) para tolerar el cold-start del plan gratuito de Render sin degradar la experiencia del resto de la app.
Correr localmente
bash
npm install
cp .env.example .env   # completar variables (ver abajo)
npx prisma db push     # sincroniza el schema con la base de datos
npm run dev
npm test                # corre la suite de Jest

Variables de entorno necesarias: conexión a base de datos (Neon/Postgres), credenciales de Cloudinary, API key de Resend, API key de Gemini, y los secretos de JWT.

🇬🇧 English

Multi-tenant REST API built with Node.js, Express and TypeScript, following Clean Architecture. Serves both the JSON API for the vendor mobile app and the server-rendered public catalog page that buyers see.

Architecture

Same three-layer split as above: domain (entities, repository interfaces, zero external deps), application (one use-case class per business action, dependency-injected repositories), infrastructure (Express routes, Prisma, Cloudinary/Resend, JWT, middlewares). Use cases depend on interfaces only, which is what lets the test suite swap in in-memory repositories without touching the real database.

Stack

Node.js/TypeScript, Express, PostgreSQL (Neon) via Prisma, JWT auth with access/refresh rotation, Cloudinary for media, Resend for email, Google Gemini for the in-catalog AI sales agent, Jest for testing (18 suites), deployed on Render.

Notable technical decisions
Slug-based multi-tenancy, with ownership checks resolved inside each use case rather than a generic middleware — every use case is explicit about its own authorization rules.
Centralized error handling via a global error handler plus domain error classes that already carry user-facing messages.
Per-request configurable timeout on the client side to tolerate Render's free-tier cold starts without degrading the rest of the app.
Run locally
bash
npm install
cp .env.example .env
npx prisma db push
npm run dev
npm test
