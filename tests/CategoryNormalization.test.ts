import { CreateStoreUseCase } from "../src/application/use-cases/CreateStoreUseCase";
import { AddProductUseCase } from "../src/application/use-cases/AddProductUseCase";
import { UpdateProductUseCase } from "../src/application/use-cases/UpdateProductUseCase";
import {
  InMemoryStoreRepository,
  InMemoryProductRepository,
} from "../src/infrastructure/services/InMemoryCatalogRepositories";

describe("Normalización de categorías (evita duplicados)", () => {
  let storeRepository: InMemoryStoreRepository;
  let productRepository: InMemoryProductRepository;
  let createStoreUseCase: CreateStoreUseCase;
  let addProductUseCase: AddProductUseCase;
  let updateProductUseCase: UpdateProductUseCase;

  beforeEach(() => {
    storeRepository = new InMemoryStoreRepository();
    productRepository = new InMemoryProductRepository();
    createStoreUseCase = new CreateStoreUseCase(storeRepository);
    addProductUseCase = new AddProductUseCase(storeRepository, productRepository);
    updateProductUseCase = new UpdateProductUseCase(storeRepository, productRepository);
  });

  it("guarda distintas variantes de escritura como la MISMA categoría", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Moda",
      whatsappPhone: "584120000000",
    });

    const p1 = await addProductUseCase.execute({
      storeId: store.id,
      requesterId: "vendedor-1",
      name: "Vestido",
      category: "ropa",
      price: 20,
      imageUrl: "https://example.com/1.jpg",
    });

    const p2 = await addProductUseCase.execute({
      storeId: store.id,
      requesterId: "vendedor-1",
      name: "Camisa",
      category: "  ROPA  ",
      price: 15,
      imageUrl: "https://example.com/2.jpg",
    });

    const p3 = await addProductUseCase.execute({
      storeId: store.id,
      requesterId: "vendedor-1",
      name: "Pantalón",
      category: "Ropa",
      price: 25,
      imageUrl: "https://example.com/3.jpg",
    });

    expect(p1.category).toBe("Ropa");
    expect(p2.category).toBe("Ropa");
    expect(p3.category).toBe("Ropa");

    const allProducts = await productRepository.findByStoreId(store.id);
    const uniqueCategories = new Set(allProducts.map((p) => p.category));
    expect(uniqueCategories.size).toBe(1);
  });

  it("también normaliza la categoría al editar un producto existente", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Moda",
      whatsappPhone: "584120000000",
    });

    const product = await addProductUseCase.execute({
      storeId: store.id,
      requesterId: "vendedor-1",
      name: "Gorra",
      category: "Accesorios",
      price: 10,
      imageUrl: "https://example.com/1.jpg",
    });

    const updated = await updateProductUseCase.execute({
      productId: product.id,
      requesterId: "vendedor-1",
      category: "  accesorios",
    });

    expect(updated.category).toBe("Accesorios");
  });
});
