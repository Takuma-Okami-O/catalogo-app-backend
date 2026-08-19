import { CreateStoreUseCase } from "../src/application/use-cases/CreateStoreUseCase";
import { AddProductUseCase } from "../src/application/use-cases/AddProductUseCase";
import { UpdateProductUseCase } from "../src/application/use-cases/UpdateProductUseCase";
import { ChangeStorePlanUseCase } from "../src/application/use-cases/SuperAdminUseCases";
import {
  InMemoryStoreRepository,
  InMemoryProductRepository,
} from "../src/infrastructure/services/InMemoryCatalogRepositories";
import { ForbiddenError, ValidationError } from "../src/domain/errors/AppError";

describe("UpdateProductUseCase — Producto destacado", () => {
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

  it("permite marcar un producto ya existente como destacado en plan PREMIUM", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Premium",
      whatsappPhone: "584120000000",
    });
    await changeStorePlanUseCase.execute({ storeId: store.id, newPlan: "PREMIUM" });
    const product = await addProductUseCase.execute({
      storeId: store.id,
      requesterId: "vendedor-1",
      name: "Producto normal",
      category: "General",
      price: 10,
      imageUrl: "https://example.com/img.jpg",
    });

    const updated = await updateProductUseCase.execute({
      productId: product.id,
      requesterId: "vendedor-1",
      isFeatured: true,
    });

    expect(updated.isFeatured).toBe(true);
  });

  it("rechaza marcar como destacado en plan FREE", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Free",
      whatsappPhone: "584120000000",
    });
    const product = await addProductUseCase.execute({
      storeId: store.id,
      requesterId: "vendedor-1",
      name: "Producto normal",
      category: "General",
      price: 10,
      imageUrl: "https://example.com/img.jpg",
    });

    await expect(
      updateProductUseCase.execute({ productId: product.id, requesterId: "vendedor-1", isFeatured: true })
    ).rejects.toThrow(ForbiddenError);
  });

  it("rechaza marcar un 4to producto como destacado (límite de 3)", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Premium",
      whatsappPhone: "584120000000",
    });
    await changeStorePlanUseCase.execute({ storeId: store.id, newPlan: "PREMIUM" });

    const ids: string[] = [];
    for (let i = 0; i < 4; i++) {
      const p = await addProductUseCase.execute({
        storeId: store.id,
        requesterId: "vendedor-1",
        name: `Producto ${i}`,
        category: "General",
        price: 10,
        imageUrl: "https://example.com/img.jpg",
      });
      ids.push(p.id);
    }

    for (let i = 0; i < 3; i++) {
      await updateProductUseCase.execute({ productId: ids[i], requesterId: "vendedor-1", isFeatured: true });
    }

    await expect(
      updateProductUseCase.execute({ productId: ids[3], requesterId: "vendedor-1", isFeatured: true })
    ).rejects.toThrow(ValidationError);
  });

  it("permite quitar el destacado y luego marcar otro sin chocar con el límite", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Premium",
      whatsappPhone: "584120000000",
    });
    await changeStorePlanUseCase.execute({ storeId: store.id, newPlan: "PREMIUM" });

    const ids: string[] = [];
    for (let i = 0; i < 4; i++) {
      const p = await addProductUseCase.execute({
        storeId: store.id,
        requesterId: "vendedor-1",
        name: `Producto ${i}`,
        category: "General",
        price: 10,
        imageUrl: "https://example.com/img.jpg",
      });
      ids.push(p.id);
    }

    for (let i = 0; i < 3; i++) {
      await updateProductUseCase.execute({ productId: ids[i], requesterId: "vendedor-1", isFeatured: true });
    }

    // Quita el destacado del primero, ahora hay espacio para el 4to.
    await updateProductUseCase.execute({ productId: ids[0], requesterId: "vendedor-1", isFeatured: false });

    const updated = await updateProductUseCase.execute({
      productId: ids[3],
      requesterId: "vendedor-1",
      isFeatured: true,
    });

    expect(updated.isFeatured).toBe(true);
  });
});
