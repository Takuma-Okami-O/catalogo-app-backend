import { CreateStoreUseCase } from "../src/application/use-cases/CreateStoreUseCase";
import { AddProductUseCase } from "../src/application/use-cases/AddProductUseCase";
import { GetPublicCatalogUseCase } from "../src/application/use-cases/GetPublicCatalogUseCase";
import { CreateOrderUseCase } from "../src/application/use-cases/CreateOrderUseCase";
import {
  InMemoryStoreRepository,
  InMemoryProductRepository,
  InMemoryOrderRepository,
} from "../src/infrastructure/services/InMemoryCatalogRepositories";
import { EmptyOrderError, StoreNotFoundError } from "../src/domain/errors/AppError";

describe("Catálogo público y pedidos", () => {
  let storeRepository: InMemoryStoreRepository;
  let productRepository: InMemoryProductRepository;
  let orderRepository: InMemoryOrderRepository;
  let createStoreUseCase: CreateStoreUseCase;
  let addProductUseCase: AddProductUseCase;
  let getPublicCatalogUseCase: GetPublicCatalogUseCase;
  let createOrderUseCase: CreateOrderUseCase;

  beforeEach(() => {
    storeRepository = new InMemoryStoreRepository();
    productRepository = new InMemoryProductRepository();
    orderRepository = new InMemoryOrderRepository();
    createStoreUseCase = new CreateStoreUseCase(storeRepository);
    addProductUseCase = new AddProductUseCase(storeRepository, productRepository);
    getPublicCatalogUseCase = new GetPublicCatalogUseCase(storeRepository, productRepository);
    createOrderUseCase = new CreateOrderUseCase(storeRepository, productRepository, orderRepository);
  });

  it("expone el catálogo público a través del slug, sin autenticación", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Gaby Encantos",
      whatsappPhone: "584120000000",
    });

    await addProductUseCase.execute({
      storeId: store.id,
      requesterId: "vendedor-1",
      name: "Vestido floral",
      category: "Mujer",
      price: 25,
      imageUrl: "https://example.com/img.jpg",
    });

    const catalog = await getPublicCatalogUseCase.execute("gaby-encantos");

    expect(catalog.store.name).toBe("Gaby Encantos");
    expect(catalog.products).toHaveLength(1);
    expect(catalog.products[0].name).toBe("Vestido floral");
  });

  it("lanza StoreNotFoundError si el slug del link no existe", async () => {
    await expect(getPublicCatalogUseCase.execute("tienda-inexistente")).rejects.toThrow(
      StoreNotFoundError
    );
  });

  it("crea el pedido, lo persiste, y genera el link de WhatsApp con el total correcto", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Gaby Encantos",
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

    const result = await createOrderUseCase.execute({
      storeSlug: "gaby-encantos",
      items: [{ productId: product.id, quantity: 2 }],
    });

    expect(result.order.total).toBe(50);
    expect(result.order.status).toBe("PENDIENTE");
    expect(result.whatsappLink).toContain("https://wa.me/584120000000");
    expect(result.whatsappLink).toContain(encodeURIComponent("Vestido floral"));

    // El pedido debe quedar guardado en el historial del vendedor
    const storedOrders = await orderRepository.findByStoreId(store.id);
    expect(storedOrders).toHaveLength(1);
  });

  it("lanza EmptyOrderError si el pedido no tiene productos", async () => {
    await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Gaby Encantos",
      whatsappPhone: "584120000000",
    });

    await expect(
      createOrderUseCase.execute({ storeSlug: "gaby-encantos", items: [] })
    ).rejects.toThrow(EmptyOrderError);
  });
});
