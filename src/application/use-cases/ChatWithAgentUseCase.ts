import { randomUUID } from "node:crypto";
import { AgentConversation } from "../../domain/entities/AgentConversation";
import { IStoreRepository } from "../../domain/repositories/ICatalogRepositories";
import { IAgentConversationRepository } from "../../domain/repositories/IAgentConversationRepository";
import { IAgentService } from "../../domain/services/IAgentService";
import { StoreNotFoundError, ValidationError } from "../../domain/errors/AppError";

export interface ChatWithAgentInput {
  storeSlug: string;
  buyerSessionId: string;
  message: string;
}

export interface ChatWithAgentOutput {
  reply: string;
  cart: ReturnType<AgentConversation["toJSON"]>["cart"];
  cartTotal: number;
}

export class ChatWithAgentUseCase {
  constructor(
    private readonly storeRepository: IStoreRepository,
    private readonly conversationRepository: IAgentConversationRepository,
    private readonly agentService: IAgentService
  ) {}

  async execute(input: ChatWithAgentInput): Promise<ChatWithAgentOutput> {
    if (!input.message || input.message.trim().length === 0) {
      throw new ValidationError("El mensaje no puede estar vacío.");
    }

    const store = await this.storeRepository.findBySlug(input.storeSlug);
    if (!store) {
      throw new StoreNotFoundError();
    }

    let conversation = await this.conversationRepository.findByStoreAndBuyer(store.id, input.buyerSessionId);
    if (!conversation) {
      conversation = AgentConversation.create({
        id: randomUUID(),
        storeId: store.id,
        buyerSessionId: input.buyerSessionId,
        createdAt: new Date(),
      });
    }

    const reply = await this.agentService.handleTurn(conversation, store, input.message.trim());

    await this.conversationRepository.save(conversation);

    return { reply, cart: conversation.cart, cartTotal: conversation.cartTotal() };
  }
}
