import { Router } from "express";
import { ITokenService } from "../../../domain/repositories/IPasswordHasher";
import { createAuthMiddleware, AuthenticatedRequest } from "../middlewares/authMiddleware";
import { asyncHandler } from "../middlewares/globalErrorHandler";
import {
  InMemoryStoreRepository,
  InMemoryProductRepository,
  InMemoryOrderRepository,
} from "../../services/InMemoryCatalogRepositories";
import { CreateStoreUseCase } from "../../../application/use-cases/CreateStoreUseCase";
import { AddProductUseCase } from "../../../application/use-cases/AddProductUseCase";
import { UpdateProductUseCase } from "../../../application/use-cases/UpdateProductUseCase";
import { DeleteProductUseCase } from "../../../application/use-cases/DeleteProductUseCase";
import { GetPublicCatalogUseCase } from "../../../application/use-cases/GetPublicCatalogUseCase";
import { GetMyStoreUseCase } from "../../../application/use-cases/GetMyStoreUseCase";
import { CreateOrderUseCase } from "../../../application/use-cases/CreateOrderUseCase";
import { ListStoresUseCase, ChangeStorePlanUseCase } from "../../../application/use-cases/SuperAdminUseCases";
import { VerifyStoreUseCase } from "../../../application/use-cases/VerifyStoreUseCase";
import { UpdateStoreWhatsAppMessageUseCase } from "../../../application/use-cases/UpdateStoreWhatsAppMessageUseCase";
import { StartFreeTrialUseCase } from "../../../application/use-cases/StartFreeTrialUseCase";
import { UpdateStoreSettingsUseCase } from "../../../application/use-cases/UpdateStoreSettingsUseCase";
import { GetStoreStatsUseCase } from "../../../application/use-cases/GetStoreStatsUseCase";
import { ChangeStoreTemplateUseCase } from "../../../application/use-cases/ChangeStoreTemplateUseCase";
import { AddTestimonialUseCase, RemoveTestimonialUseCase } from "../../../application/use-cases/TestimonialUseCases";
import { GenerateActivationCodeUseCase } from "../../../application/use-cases/GenerateActivationCodeUseCase";
import { RedeemActivationCodeUseCase } from "../../../application/use-cases/RedeemActivationCodeUseCase";
import { CATALOG_THEMES } from "./templates/catalogThemes";
import { ForbiddenError, ValidationError } from "../../../domain/errors/AppError";
import {
  IStoreRepository,
  IProductRepository,
  IOrderRepository,
  IStoreVisitRepository,
  IPremiumCodeRepository,
} from "../../../domain/repositories/ICatalogRepositories";
import { InMemoryStoreVisitRepository, InMemoryPremiumCodeRepository } from "../../services/InMemoryCatalogRepositories";

export interface CatalogRepositories {
  storeRepository?: IStoreRepository;
  productRepository?: IProductRepository;
  orderRepository?: IOrderRepository;
  visitRepository?: IStoreVisitRepository;
  codeRepository?: IPremiumCodeRepository;
}

/**
 * Composition root del módulo de catálogo. Los repos son inyectables:
 * en desarrollo/tests se usan los de memoria (default), en producción
 * server.ts inyecta las implementaciones de Prisma.
 */
export function buildCatalogRoutes(tokenService: ITokenService, repos: CatalogRepositories = {}) {
  const router = Router();
  const authMiddleware = createAuthMiddleware(tokenService);

  const storeRepository = repos.storeRepository ?? new InMemoryStoreRepository();
  const productRepository = repos.productRepository ?? new InMemoryProductRepository();
  const orderRepository = repos.orderRepository ?? new InMemoryOrderRepository();
  const visitRepository = repos.visitRepository ?? new InMemoryStoreVisitRepository();
  const codeRepository = repos.codeRepository ?? new InMemoryPremiumCodeRepository();

  const createStoreUseCase = new CreateStoreUseCase(storeRepository);
  const addProductUseCase = new AddProductUseCase(storeRepository, productRepository);
  const updateProductUseCase = new UpdateProductUseCase(storeRepository, productRepository);
  const deleteProductUseCase = new DeleteProductUseCase(storeRepository, productRepository);
  const getPublicCatalogUseCase = new GetPublicCatalogUseCase(storeRepository, productRepository);
  const getMyStoreUseCase = new GetMyStoreUseCase(storeRepository, productRepository);
  const createOrderUseCase = new CreateOrderUseCase(storeRepository, productRepository, orderRepository);
  const listStoresUseCase = new ListStoresUseCase(storeRepository, productRepository);
  const changeStorePlanUseCase = new ChangeStorePlanUseCase(storeRepository);
  const verifyStoreUseCase = new VerifyStoreUseCase(storeRepository);
  const updateStoreWhatsAppMessageUseCase = new UpdateStoreWhatsAppMessageUseCase(storeRepository);
  const startFreeTrialUseCase = new StartFreeTrialUseCase(storeRepository);
  const updateStoreSettingsUseCase = new UpdateStoreSettingsUseCase(storeRepository);
  const getStoreStatsUseCase = new GetStoreStatsUseCase(storeRepository, visitRepository, orderRepository);
  const changeStoreTemplateUseCase = new ChangeStoreTemplateUseCase(storeRepository);
  const addTestimonialUseCase = new AddTestimonialUseCase(storeRepository);
  const removeTestimonialUseCase = new RemoveTestimonialUseCase(storeRepository);
  const generateActivationCodeUseCase = new GenerateActivationCodeUseCase(codeRepository);
  const redeemActivationCodeUseCase = new RedeemActivationCodeUseCase(storeRepository, codeRepository);

  // ---------- VENDEDOR (requiere JWT) ----------

  router.get(
    "/stores/me",
    authMiddleware,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const result = await getMyStoreUseCase.execute(req.auth!.userId);
      res.status(200).json({ success: true, data: result });
    })
  );

  router.post(
    "/stores/me/start-trial",
    authMiddleware,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const store = await startFreeTrialUseCase.execute(req.auth!.userId);
      res.status(200).json({ success: true, data: store.toOwnerJSON() });
    })
  );

  router.get(
    "/stores/me/stats",
    authMiddleware,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const stats = await getStoreStatsUseCase.execute(req.auth!.userId);
      res.status(200).json({ success: true, data: stats });
    })
  );

  router.get(
    "/templates",
    asyncHandler(async (_req, res) => {
      const list = Object.entries(CATALOG_THEMES).map(([id, theme]) => ({ id, name: theme.name }));
      res.status(200).json({ success: true, data: list });
    })
  );

  router.patch(
    "/stores/me/template",
    authMiddleware,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const store = await changeStoreTemplateUseCase.execute(req.auth!.userId, req.body.templateId);
      res.status(200).json({ success: true, data: store.toOwnerJSON() });
    })
  );

  router.post(
    "/stores/me/testimonials",
    authMiddleware,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const store = await addTestimonialUseCase.execute(req.auth!.userId, req.body.imageUrl);
      res.status(200).json({ success: true, data: store.toOwnerJSON() });
    })
  );

  router.delete(
    "/stores/me/testimonials",
    authMiddleware,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const store = await removeTestimonialUseCase.execute(req.auth!.userId, req.body.imageUrl);
      res.status(200).json({ success: true, data: store.toOwnerJSON() });
    })
  );

  router.patch(
    "/stores/me",
    authMiddleware,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const store = await updateStoreSettingsUseCase.execute({
        ownerId: req.auth!.userId,
        name: req.body.name,
        logoUrl: req.body.logoUrl,
        whatsappPhone: req.body.whatsappPhone,
        whatsappMessageTemplate: req.body.whatsappMessageTemplate,
        instagramUrl: req.body.instagramUrl,
        tiktokUrl: req.body.tiktokUrl,
      });
      res.status(200).json({ success: true, data: store.toOwnerJSON() });
    })
  );

  router.post(
    "/stores",
    authMiddleware,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const store = await createStoreUseCase.execute({
        ownerId: req.auth!.userId,
        name: req.body.name,
        whatsappPhone: req.body.whatsappPhone,
      });
      res.status(201).json({ success: true, data: store.toOwnerJSON() });
    })
  );

  router.post(
    "/stores/:storeId/products",
    authMiddleware,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const product = await addProductUseCase.execute({
        storeId: req.params.storeId,
        requesterId: req.auth!.userId,
        name: req.body.name,
        category: req.body.category,
        price: req.body.price,
        imageUrl: req.body.imageUrl,
        gifUrl: req.body.gifUrl ?? null,
        images: req.body.images,
        videoUrl: req.body.videoUrl ?? null,
        isFeatured: req.body.isFeatured,
        stockCount: req.body.stockCount,
      });
      res.status(201).json({ success: true, data: product.toJSON() });
    })
  );

  router.patch(
    "/products/:productId",
    authMiddleware,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const product = await updateProductUseCase.execute({
        productId: req.params.productId,
        requesterId: req.auth!.userId,
        name: req.body.name,
        category: req.body.category,
        price: req.body.price,
        imageUrl: req.body.imageUrl,
        gifUrl: req.body.gifUrl,
        images: req.body.images,
        videoUrl: req.body.videoUrl,
        available: req.body.available,
        isFeatured: req.body.isFeatured,
        stockCount: req.body.stockCount,
        saleDiscountPercent: req.body.saleDiscountPercent,
        saleEndsAt: req.body.saleEndsAt,
      });
      res.status(200).json({ success: true, data: product.toJSON() });
    })
  );

  router.delete(
    "/products/:productId",
    authMiddleware,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      await deleteProductUseCase.execute({
        productId: req.params.productId,
        requesterId: req.auth!.userId,
      });
      res.status(200).json({ success: true, data: { deleted: true } });
    })
  );

  // ---------- COMPRADOR (público, sin auth — es el link único) ----------

  router.get(
    "/catalogo/:slug",
    asyncHandler(async (req, res) => {
      const result = await getPublicCatalogUseCase.execute(req.params.slug);
      res.status(200).json({ success: true, data: result });
    })
  );

  router.post(
    "/catalogo/:slug/pedidos",
    asyncHandler(async (req, res) => {
      const result = await createOrderUseCase.execute({
        storeSlug: req.params.slug,
        items: req.body.items,
      });
      res.status(201).json({ success: true, data: result });
    })
  );

  // ---------- SUPER ADMIN (requiere JWT + rol ADMIN) ----------

  router.get(
    "/admin/stores",
    authMiddleware,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      if (req.auth!.role !== "ADMIN") {
        throw new ForbiddenError("Solo un super administrador puede ver esta información.");
      }
      const stores = await listStoresUseCase.execute();
      res.status(200).json({ success: true, data: stores });
    })
  );

  router.patch(
    "/admin/stores/:storeId/plan",
    authMiddleware,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      if (req.auth!.role !== "ADMIN") {
        throw new ForbiddenError("Solo un super administrador puede cambiar planes.");
      }
      if (!["FREE", "PREMIUM"].includes(req.body.newPlan)) {
        throw new ValidationError("El plan debe ser FREE o PREMIUM.");
      }
      const store = await changeStorePlanUseCase.execute({
        storeId: req.params.storeId,
        newPlan: req.body.newPlan,
        customLimit: req.body.customLimit,
        planDurationDays: req.body.planDurationDays,
      });
      res.status(200).json({ success: true, data: store.toAdminJSON() });
    })
  );

  router.patch(
    "/admin/stores/:storeId/verify",
    authMiddleware,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      if (req.auth!.role !== "ADMIN") {
        throw new ForbiddenError("Solo un super administrador puede verificar tiendas.");
      }
      if (typeof req.body.isVerified !== "boolean") {
        throw new ValidationError("isVerified debe ser true o false.");
      }
      const store = await verifyStoreUseCase.execute({
        storeId: req.params.storeId,
        rif: req.body.rif ?? null,
        isVerified: req.body.isVerified,
      });
      res.status(200).json({ success: true, data: store.toAdminJSON() });
    })
  );

  router.patch(
    "/admin/stores/:storeId/whatsapp-template",
    authMiddleware,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      if (req.auth!.role !== "ADMIN") {
        throw new ForbiddenError("Solo un super administrador puede editar el mensaje de WhatsApp de una tienda.");
      }
      if (typeof req.body.whatsappMessageTemplate !== "string") {
        throw new ValidationError("whatsappMessageTemplate debe ser un texto.");
      }
      const store = await updateStoreWhatsAppMessageUseCase.execute({
        storeId: req.params.storeId,
        whatsappMessageTemplate: req.body.whatsappMessageTemplate,
      });
      res.status(200).json({ success: true, data: store.toAdminJSON() });
    })
  );

  router.post(
    "/admin/activation-codes",
    authMiddleware,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      if (req.auth!.role !== "ADMIN") {
        throw new ForbiddenError("Solo un super administrador puede generar códigos.");
      }
      const result = await generateActivationCodeUseCase.execute(req.body.durationDays ?? 30);
      res.status(201).json({ success: true, data: result });
    })
  );

  router.post(
    "/stores/me/redeem-code",
    authMiddleware,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const store = await redeemActivationCodeUseCase.execute(req.auth!.userId, req.body.code);
      res.status(200).json({ success: true, data: store.toOwnerJSON() });
    })
  );

  return router;
}
