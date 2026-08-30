import { CreateStoreUseCase } from "../src/application/use-cases/CreateStoreUseCase";
import { AddProductUseCase } from "../src/application/use-cases/AddProductUseCase";
import { CreateOrderUseCase } from "../src/application/use-cases/CreateOrderUseCase";
import { RecordStoreVisitUseCase } from "../src/application/use-cases/RecordStoreVisitUseCase";
import { GetStoreStatsUseCase } from "../src/application/use-cases/GetStoreStatsUseCase";
import { ChangeStorePlanUseCase } from "../src/application/use-cases/SuperAdminUseCases";
import {
  InMemoryStoreRepository,
  InMemoryProductRepository,
  InMemoryOrderRepository,
  InMemoryStoreVisitRepository,
} from "../src/infrastructure/services/InMemoryCatalogRepositories";

describe("GetStoreStatsUseCase", () => {
  let storeRepository: InMemoryStoreRepository;
  let productRepository: InMemoryProductRepository;
  let orderRepository: InMemoryOrderRepository;
  let visitRepository: InMemoryStoreVisitRepository;
  let createStoreUseCase: CreateStoreUseCase;
  let addProductUseCase: AddProductUseCase;
  let createOrderUseCase: CreateOrderUseCase;
  let recordVisitUseCase: RecordStoreVisitUseCase;
  let getStatsUseCase: GetStoreStatsUseCase;
  let changePlanUseCase: ChangeStorePlanUseCase;

  beforeEach(() => {
    storeRepository = new InMemoryStoreRepository();
    productRepository = new InMemoryProductRepository();
    orderRepository = new InMemoryOrderRepository();
    visitRepository = new InMemoryStoreVisitRepository();
    createStoreUseCase = new CreateStoreUseCase(storeRepository);
    addProductUseCase = new AddProductUseCase(storeRepository, productRepository);
    createOrderUseCase = new CreateOrderUseCase(storeRepository, productRepository, orderRepository);
    recordVisitUseCase = new RecordStoreVisitUseCase(visitRepository);
    getStatsUseCase = new GetStoreStatsUseCase(storeRepository, visitRepository, orderRepository);
    changePlanUseCase = new ChangeStorePlanUseCase(storeRepository);
  });

  it("permite el acceso a estadísticas aunque la tienda esté en plan FREE", async () => {
    await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Free",
      whatsappPhone: "584120000000",
    });

    const stats = await getStatsUseCase.execute("vendedor-1");
    expect(stats.totalVisits).toBe(0);
  });

  it("calcula visitas totales y productos más pedidos para una tienda PREMIUM", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Premium",
      whatsappPhone: "584120000000",
    });
    await changePlanUseCase.execute({ storeId: store.id, newPlan: "PREMIUM" });

    const product = await addProductUseCase.execute({
      storeId: store.id,
      requesterId: "vendedor-1",
      name: "Vestido floral",
      category: "Mujer",
      price: 25,
      imageUrl: "https://example.com/img.jpg",
    });

    await recordVisitUseCase.execute(store.id);
    await recordVisitUseCase.execute(store.id);
    await recordVisitUseCase.execute(store.id);

    await createOrderUseCase.execute({
      storeSlug: store.slug,
      items: [{ productId: product.id, quantity: 3 }],
    });
    await createOrderUseCase.execute({
      storeSlug: store.slug,
      items: [{ productId: product.id, quantity: 1 }],
    });

    const stats = await getStatsUseCase.execute("vendedor-1");

    expect(stats.totalVisits).toBe(3);
    expect(stats.totalOrders).toBe(2);
    expect(stats.visitsLast7Days).toHaveLength(7);
    expect(stats.topProducts[0].productName).toBe("Vestido floral");
    expect(stats.topProducts[0].totalQuantity).toBe(4);
    expect(stats.topProducts[0].timesOrdered).toBe(2);
    expect(stats.topProducts[0].ref).toMatch(/^REF-[A-Z0-9]{4}$/);
  });
});
