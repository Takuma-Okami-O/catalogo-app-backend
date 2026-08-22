import { CreateStoreUseCase } from "../src/application/use-cases/CreateStoreUseCase";
import { AddProductUseCase } from "../src/application/use-cases/AddProductUseCase";
import { UpdateProductUseCase } from "../src/application/use-cases/UpdateProductUseCase";
import { ChangeStorePlanUseCase } from "../src/application/use-cases/SuperAdminUseCases";
import {
  InMemoryStoreRepository,
  InMemoryProductRepository,
} from "../src/infrastructure/services/InMemoryCatalogRepositories";
import { ForbiddenError, ValidationError } from "../src/domain/errors/AppError";

describe("Stock y Ofertas relámpago", () => {
  let storeRepository: InMemoryStoreRepository;
  let productRepository: InMemoryProductRepository;
  let createStoreUseCase: CreateStoreUseCase;
  let addProductUseCase: AddProductUseCase;
  let updateProductUseCase: UpdateProductUseCase;
  let changeStorePlanUseCase: ChangeStorePlanUseCase;

  beforeEach(() => {
    storeRepository = new InMemoryStoreRepository();
    productRepository = new InMemoryProductRepository();
    createStoreUseCase = new CreateStoreUseCase(storeRepository);
    addProductUseCase = new AddProductUseCase(storeRepository, productRepository);
    updateProductUseCase = new UpdateProductUseCase(storeRepository, productRepository);
    changeStorePlanUseCase = new ChangeStorePlanUseCase(storeRepository);
  });

  it("un producto sin stockCount se comporta como antes (usa el switch 'available')", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda",
      whatsappPhone: "584120000000",
    });
    const product = await addProductUseCase.execute({
      storeId: store.id,
      requesterId: "vendedor-1",
      name: "Producto",
      category: "General",
      price: 10,
      imageUrl: "https://example.com/img.jpg",
    });

    expect(product.stockCount).toBeNull();
    expect(product.isEffectivelyAvailable).toBe(true);
  });

  it("con stockCount en 0, el producto se marca automáticamente como no disponible", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda",
      whatsappPhone: "584120000000",
    });
    const product = await addProductUseCase.execute({
      storeId: store.id,
      requesterId: "vendedor-1",
      name: "Producto",
      category: "General",
      price: 10,
      imageUrl: "https://example.com/img.jpg",
      stockCount: 0,
    });

    expect(product.isEffectivelyAvailable).toBe(false);
  });

  it("rechaza un stockCount negativo", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda",
      whatsappPhone: "584120000000",
    });
    const product = await addProductUseCase.execute({
      storeId: store.id,
      requesterId: "vendedor-1",
      name: "Producto",
      category: "General",
      price: 10,
      imageUrl: "https://example.com/img.jpg",
    });

    await expect(
      updateProductUseCase.execute({ productId: product.id, requesterId: "vendedor-1", stockCount: -1 })
    ).rejects.toThrow(ValidationError);
  });

  it("rechaza activar una oferta relámpago en plan FREE", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Free",
      whatsappPhone: "584120000000",
    });
    const product = await addProductUseCase.execute({
      storeId: store.id,
      requesterId: "vendedor-1",
      name: "Producto",
      category: "General",
      price: 10,
      imageUrl: "https://example.com/img.jpg",
    });

    await expect(
      updateProductUseCase.execute({
        productId: product.id,
        requesterId: "vendedor-1",
        saleDiscountPercent: 20,
        saleEndsAt: new Date(Date.now() + 3600_000).toISOString(),
      })
    ).rejects.toThrow(ForbiddenError);
  });

  it("permite activar una oferta relámpago en plan PREMIUM y se refleja en el JSON público", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Premium",
      whatsappPhone: "584120000000",
    });
    await changeStorePlanUseCase.execute({ storeId: store.id, newPlan: "PREMIUM" });
    const product = await addProductUseCase.execute({
      storeId: store.id,
      requesterId: "vendedor-1",
      name: "Producto",
      category: "General",
      price: 10,
      imageUrl: "https://example.com/img.jpg",
    });

    const futureDate = new Date(Date.now() + 3600_000).toISOString();
    const updated = await updateProductUseCase.execute({
      productId: product.id,
      requesterId: "vendedor-1",
      saleDiscountPercent: 20,
      saleEndsAt: futureDate,
    });

    expect(updated.hasActiveSale).toBe(true);
    expect(updated.toJSON().saleDiscountPercent).toBe(20);
  });

  it("una oferta ya vencida no se muestra como activa en el JSON público", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Premium",
      whatsappPhone: "584120000000",
    });
    await changeStorePlanUseCase.execute({ storeId: store.id, newPlan: "PREMIUM" });
    const product = await addProductUseCase.execute({
      storeId: store.id,
      requesterId: "vendedor-1",
      name: "Producto",
      category: "General",
      price: 10,
      imageUrl: "https://example.com/img.jpg",
    });

    const pastDate = new Date(Date.now() - 3600_000).toISOString();
    const updated = await updateProductUseCase.execute({
      productId: product.id,
      requesterId: "vendedor-1",
      saleDiscountPercent: 20,
      saleEndsAt: pastDate,
    });

    expect(updated.hasActiveSale).toBe(false);
    expect(updated.toJSON().saleDiscountPercent).toBeNull();
  });

  it("permite desactivar una oferta relámpago enviando null en ambos campos", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Premium",
      whatsappPhone: "584120000000",
    });
    await changeStorePlanUseCase.execute({ storeId: store.id, newPlan: "PREMIUM" });
    const product = await addProductUseCase.execute({
      storeId: store.id,
      requesterId: "vendedor-1",
      name: "Producto",
      category: "General",
      price: 10,
      imageUrl: "https://example.com/img.jpg",
    });
    await updateProductUseCase.execute({
      productId: product.id,
      requesterId: "vendedor-1",
      saleDiscountPercent: 20,
      saleEndsAt: new Date(Date.now() + 3600_000).toISOString(),
    });

    const updated = await updateProductUseCase.execute({
      productId: product.id,
      requesterId: "vendedor-1",
      saleDiscountPercent: null,
      saleEndsAt: null,
    });

    expect(updated.hasActiveSale).toBe(false);
  });
});
