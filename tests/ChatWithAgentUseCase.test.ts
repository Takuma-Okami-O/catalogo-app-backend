import { ChatWithAgentUseCase } from "../src/application/use-cases/ChatWithAgentUseCase";
import { CreateStoreUseCase } from "../src/application/use-cases/CreateStoreUseCase";
import { AddProductUseCase } from "../src/application/use-cases/AddProductUseCase";
import { InMemoryStoreRepository, InMemoryProductRepository } from "../src/infrastructure/services/InMemoryCatalogRepositories";
import { InMemoryAgentConversationRepository } from "../src/infrastructure/services/InMemoryAgentConversationRepository";
import { AgentConversation } from "../src/domain/entities/AgentConversation";
import { Store } from "../src/domain/entities/Store";
import { IAgentService } from "../src/domain/services/IAgentService";
import { StoreNotFoundError, ValidationError } from "../src/domain/errors/AppError";

/**
 * Reemplaza a AnthropicAgentService en los tests: no llama a ninguna API
 * externa, solo simula que el agente agrega un producto al carrito y
 * responde un texto fijo. Así probamos ChatWithAgentUseCase de forma
 * aislada y determinística, sin costo ni red.
 */
class FakeAgentService implements IAgentService {
  public receivedMessages: string[] = [];

  async handleTurn(conversation: AgentConversation, _store: Store, userMessage: string): Promise<string> {
    this.receivedMessages.push(userMessage);
    conversation.addMessage("user", userMessage);

    if (userMessage.includes("zapatos")) {
      conversation.addToCart({
        productId: "prod-1",
        productName: "Zapatos Reebok",
        unitPrice: 40,
        quantity: 1,
      });
    }

    const reply = `Respuesta simulada a: ${userMessage}`;
    conversation.addMessage("assistant", reply);
    return reply;
  }
}

describe("ChatWithAgentUseCase", () => {
  let storeRepository: InMemoryStoreRepository;
  let productRepository: InMemoryProductRepository;
  let conversationRepository: InMemoryAgentConversationRepository;
  let fakeAgentService: FakeAgentService;
  let useCase: ChatWithAgentUseCase;
  let storeId: string;
  let storeSlug: string;

  beforeEach(async () => {
    storeRepository = new InMemoryStoreRepository();
    productRepository = new InMemoryProductRepository();
    conversationRepository = new InMemoryAgentConversationRepository();
    fakeAgentService = new FakeAgentService();
    useCase = new ChatWithAgentUseCase(storeRepository, conversationRepository, fakeAgentService);

    const createStoreUseCase = new CreateStoreUseCase(storeRepository);
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Gaby Encantos",
      whatsappPhone: "584120000000",
    });
    storeId = store.id;
    storeSlug = store.slug;

    const addProductUseCase = new AddProductUseCase(storeRepository, productRepository);
    await addProductUseCase.execute({
      storeId,
      requesterId: "vendedor-1",
      name: "Zapatos Reebok",
      category: "Caballeros",
      price: 40,
      imageUrl: "https://example.com/img.jpg",
    });
  });

  it("crea una conversación nueva en el primer mensaje del comprador", async () => {
    const result = await useCase.execute({
      storeSlug,
      buyerSessionId: "buyer-abc",
      message: "Hola, busco zapatos",
    });

    expect(result.reply).toContain("Hola, busco zapatos");
    expect(fakeAgentService.receivedMessages).toEqual(["Hola, busco zapatos"]);
  });

  it("reutiliza la misma conversación entre mensajes del mismo comprador", async () => {
    await useCase.execute({ storeSlug, buyerSessionId: "buyer-abc", message: "Hola" });
    await useCase.execute({ storeSlug, buyerSessionId: "buyer-abc", message: "¿Tienen zapatos?" });

    const conversation = await conversationRepository.findByStoreAndBuyer(storeId, "buyer-abc");
    expect(conversation).not.toBeNull();
    expect(conversation!.messages).toHaveLength(4); // 2 user + 2 assistant
  });

  it("mantiene conversaciones separadas por comprador dentro de la misma tienda", async () => {
    await useCase.execute({ storeSlug, buyerSessionId: "buyer-1", message: "Hola" });
    await useCase.execute({ storeSlug, buyerSessionId: "buyer-2", message: "Hola" });

    const conv1 = await conversationRepository.findByStoreAndBuyer(storeId, "buyer-1");
    const conv2 = await conversationRepository.findByStoreAndBuyer(storeId, "buyer-2");
    expect(conv1!.id).not.toBe(conv2!.id);
  });

  it("acumula el carrito cuando el agente decide agregar un producto", async () => {
    const result = await useCase.execute({
      storeSlug,
      buyerSessionId: "buyer-abc",
      message: "quiero esos zapatos",
    });

    expect(result.cart).toHaveLength(1);
    expect(result.cartTotal).toBe(40);
  });

  it("lanza StoreNotFoundError si el slug no existe", async () => {
    await expect(
      useCase.execute({ storeSlug: "tienda-inexistente", buyerSessionId: "buyer-abc", message: "Hola" })
    ).rejects.toThrow(StoreNotFoundError);
  });

  it("lanza ValidationError si el mensaje viene vacío", async () => {
    await expect(
      useCase.execute({ storeSlug, buyerSessionId: "buyer-abc", message: "   " })
    ).rejects.toThrow(ValidationError);
  });
});
