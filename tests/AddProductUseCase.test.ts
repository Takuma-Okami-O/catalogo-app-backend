import { CreateStoreUseCase } from "../src/application/use-cases/CreateStoreUseCase";
import { AddProductUseCase } from "../src/application/use-cases/AddProductUseCase";
import { ChangeStorePlanUseCase } from "../src/application/use-cases/SuperAdminUseCases";
import {
  InMemoryStoreRepository,
  InMemoryProductRepository,
} from "../src/infrastructure/services/InMemoryCatalogRepositories";
import { ProductLimitExceededError, ForbiddenError, ValidationError } from "../src/domain/errors/AppError";

describe("AddProductUseCase — límites de plan", () => {
  let storeRepository: InMemoryStoreRepository;
  let productRepository: InMemoryProductRepository;
  let createStoreUseCase: CreateStoreUseCase;
  let addProductUseCase: AddProductUseCase;
  let changeStorePlanUseCase: ChangeStorePlanUseCase;

  beforeEach(() => {
    storeRepository = new InMemoryStoreRepository();
    productRepository = new InMemoryProductRepository();
    createStoreUseCase = new CreateStoreUseCase(storeRepository);
    addProductUseCase = new AddProductUseCase(storeRepository, productRepository);
    changeStorePlanUseCase = new ChangeStorePlanUseCase(storeRepository);
  });

  it("permite agregar un producto normalmente dentro del límite del plan FREE", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Mi Tienda",
      whatsappPhone: "584120000000",
    });

    const product = await addProductUseCase.execute({
      storeId: store.id,
      requesterId: "vendedor-1",
      name: "Vestido floral",
      category: "Mujer",
      price: 25,
      imageUrl: "https://example.com/img.jpg",
    });

    expect(product.name).toBe("Vestido floral");
  });

  it("rechaza agregar un producto que no pertenece al vendedor autenticado", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Mi Tienda",
      whatsappPhone: "584120000000",
    });

    await expect(
      addProductUseCase.execute({
        storeId: store.id,
        requesterId: "otro-vendedor",
        name: "Producto ajeno",
        category: "General",
        price: 10,
        imageUrl: "https://example.com/img.jpg",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("lanza ProductLimitExceededError al superar el límite del plan FREE (30 productos)", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Pequeña",
      whatsappPhone: "584120000000",
    });

    for (let i = 0; i < 30; i++) {
      await addProductUseCase.execute({
        storeId: store.id,
        requesterId: "vendedor-1",
        name: `Producto ${i}`,
        category: "General",
        price: 10,
        imageUrl: "https://example.com/img.jpg",
      });
    }

    await expect(
      addProductUseCase.execute({
        storeId: store.id,
        requesterId: "vendedor-1",
        name: "Producto 31",
        category: "General",
        price: 10,
        imageUrl: "https://example.com/img.jpg",
      })
    ).rejects.toThrow(ProductLimitExceededError);
  });

  it("permite superar el límite FREE después de que el super admin actualiza a PREMIUM", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Creciendo",
      whatsappPhone: "584120000000",
    });

    for (let i = 0; i < 30; i++) {
      await addProductUseCase.execute({
        storeId: store.id,
        requesterId: "vendedor-1",
        name: `Producto ${i}`,
        category: "General",
        price: 10,
        imageUrl: "https://example.com/img.jpg",
      });
    }

    await changeStorePlanUseCase.execute({ storeId: store.id, newPlan: "PREMIUM" });

    const product21 = await addProductUseCase.execute({
      storeId: store.id,
      requesterId: "vendedor-1",
      name: "Producto 31",
      category: "General",
      price: 10,
      imageUrl: "https://example.com/img.jpg",
    });

    expect(product21.name).toBe("Producto 31");
  });
});

describe("AddProductUseCase — GIF exclusivo del plan Premium", () => {
  let storeRepository: InMemoryStoreRepository;
  let productRepository: InMemoryProductRepository;
  let createStoreUseCase: CreateStoreUseCase;
  let addProductUseCase: AddProductUseCase;
  let changeStorePlanUseCase: ChangeStorePlanUseCase;

  beforeEach(() => {
    storeRepository = new InMemoryStoreRepository();
    productRepository = new InMemoryProductRepository();
    createStoreUseCase = new CreateStoreUseCase(storeRepository);
    addProductUseCase = new AddProductUseCase(storeRepository, productRepository);
    changeStorePlanUseCase = new ChangeStorePlanUseCase(storeRepository);
  });

  it("rechaza subir un GIF si la tienda está en plan FREE", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Free",
      whatsappPhone: "584120000000",
    });

    await expect(
      addProductUseCase.execute({
        storeId: store.id,
        requesterId: "vendedor-1",
        name: "Zapatos animados",
        category: "Calzado",
        price: 30,
        imageUrl: "https://example.com/img.jpg",
        gifUrl: "https://example.com/animacion.gif",
      })
    ).rejects.toThrow(ForbiddenError);
  });

  it("permite subir GIF una vez que la tienda tiene plan PREMIUM", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Premium",
      whatsappPhone: "584120000000",
    });

    await changeStorePlanUseCase.execute({ storeId: store.id, newPlan: "PREMIUM" });

    const product = await addProductUseCase.execute({
      storeId: store.id,
      requesterId: "vendedor-1",
      name: "Zapatos animados",
      category: "Calzado",
      price: 30,
      imageUrl: "https://example.com/img.jpg",
      gifUrl: "https://example.com/animacion.gif",
    });

    expect(product.gifUrl).toBe("https://example.com/animacion.gif");
  });

  it("permite crear el producto en plan FREE mientras no se envíe gifUrl", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Free",
      whatsappPhone: "584120000000",
    });

    const product = await addProductUseCase.execute({
      storeId: store.id,
      requesterId: "vendedor-1",
      name: "Zapatos normales",
      category: "Calzado",
      price: 30,
      imageUrl: "https://example.com/img.jpg",
    });

    expect(product.gifUrl).toBeNull();
  });
});

describe("AddProductUseCase — Producto destacado (Premium, máx. 3)", () => {
  let storeRepository: InMemoryStoreRepository;
  let productRepository: InMemoryProductRepository;
  let createStoreUseCase: CreateStoreUseCase;
  let addProductUseCase: AddProductUseCase;
  let changeStorePlanUseCase: ChangeStorePlanUseCase;

  beforeEach(() => {
    storeRepository = new InMemoryStoreRepository();
    productRepository = new InMemoryProductRepository();
    createStoreUseCase = new CreateStoreUseCase(storeRepository);
    addProductUseCase = new AddProductUseCase(storeRepository, productRepository);
    changeStorePlanUseCase = new ChangeStorePlanUseCase(storeRepository);
  });

  it("rechaza marcar un producto como destacado si la tienda está en plan FREE", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Free",
      whatsappPhone: "584120000000",
    });

    await expect(
      addProductUseCase.execute({
        storeId: store.id,
        requesterId: "vendedor-1",
        name: "Producto estrella",
        category: "General",
        price: 10,
        imageUrl: "https://example.com/img.jpg",
        isFeatured: true,
      })
    ).rejects.toThrow(ForbiddenError);
  });

  it("permite marcar hasta 3 productos como destacados en plan PREMIUM", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Premium",
      whatsappPhone: "584120000000",
    });
    await changeStorePlanUseCase.execute({ storeId: store.id, newPlan: "PREMIUM" });

    for (let i = 0; i < 3; i++) {
      const product = await addProductUseCase.execute({
        storeId: store.id,
        requesterId: "vendedor-1",
        name: `Destacado ${i}`,
        category: "General",
        price: 10,
        imageUrl: "https://example.com/img.jpg",
        isFeatured: true,
      });
      expect(product.isFeatured).toBe(true);
    }
  });

  it("rechaza marcar un 4to producto destacado (límite de 3)", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Premium",
      whatsappPhone: "584120000000",
    });
    await changeStorePlanUseCase.execute({ storeId: store.id, newPlan: "PREMIUM" });

    for (let i = 0; i < 3; i++) {
      await addProductUseCase.execute({
        storeId: store.id,
        requesterId: "vendedor-1",
        name: `Destacado ${i}`,
        category: "General",
        price: 10,
        imageUrl: "https://example.com/img.jpg",
        isFeatured: true,
      });
    }

    await expect(
      addProductUseCase.execute({
        storeId: store.id,
        requesterId: "vendedor-1",
        name: "Destacado 4",
        category: "General",
        price: 10,
        imageUrl: "https://example.com/img.jpg",
        isFeatured: true,
      })
    ).rejects.toThrow(ValidationError);
  });
});
