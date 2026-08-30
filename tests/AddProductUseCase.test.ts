import { CreateStoreUseCase } from "../src/application/use-cases/CreateStoreUseCase";
import { AddProductUseCase } from "../src/application/use-cases/AddProductUseCase";
import { ChangeStorePlanUseCase } from "../src/application/use-cases/SuperAdminUseCases";
import {
  InMemoryStoreRepository,
  InMemoryProductRepository,
} from "../src/infrastructure/services/InMemoryCatalogRepositories";
import { ProductLimitExceededError, ValidationError } from "../src/domain/errors/AppError";

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

  it("lanza ProductLimitExceededError al superar el límite de la tienda (500 productos)", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Pequeña",
      whatsappPhone: "584120000000",
    });
    // Le bajamos el límite a un número chico solo para esta prueba, así el
    // test no tiene que crear 500 productos de verdad para llegar al tope.
    await changeStorePlanUseCase.execute({ storeId: store.id, newPlan: "FREE", customLimit: 3 });

    for (let i = 0; i < 3; i++) {
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
        name: "Producto extra",
        category: "General",
        price: 10,
        imageUrl: "https://example.com/img.jpg",
      })
    ).rejects.toThrow(ProductLimitExceededError);
  });

  it("permite superar el límite después de que el super admin lo amplíe manualmente", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Creciendo",
      whatsappPhone: "584120000000",
    });
    await changeStorePlanUseCase.execute({ storeId: store.id, newPlan: "FREE", customLimit: 2 });

    for (let i = 0; i < 2; i++) {
      await addProductUseCase.execute({
        storeId: store.id,
        requesterId: "vendedor-1",
        name: `Producto ${i}`,
        category: "General",
        price: 10,
        imageUrl: "https://example.com/img.jpg",
      });
    }

    await changeStorePlanUseCase.execute({ storeId: store.id, newPlan: "PREMIUM", customLimit: 10 });

    const productExtra = await addProductUseCase.execute({
      storeId: store.id,
      requesterId: "vendedor-1",
      name: "Producto extra",
      category: "General",
      price: 10,
      imageUrl: "https://example.com/img.jpg",
    });

    expect(productExtra.name).toBe("Producto extra");
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

  it("permite subir un GIF aunque la tienda esté en plan FREE (app de acceso libre)", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Free",
      whatsappPhone: "584120000000",
    });

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

  it("permite marcar un producto como destacado aunque la tienda esté en plan FREE", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Free",
      whatsappPhone: "584120000000",
    });

    const product = await addProductUseCase.execute({
      storeId: store.id,
      requesterId: "vendedor-1",
      name: "Producto estrella",
      category: "General",
      price: 10,
      imageUrl: "https://example.com/img.jpg",
      isFeatured: true,
    });

    expect(product.isFeatured).toBe(true);
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
