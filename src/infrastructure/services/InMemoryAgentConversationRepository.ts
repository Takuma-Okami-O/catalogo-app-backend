import { AgentConversation } from "../../domain/entities/AgentConversation";
import { IAgentConversationRepository } from "../../domain/repositories/IAgentConversationRepository";

export class InMemoryAgentConversationRepository implements IAgentConversationRepository {
  private conversations = new Map<string, AgentConversation>();

  private key(storeId: string, buyerSessionId: string): string {
    return `${storeId}::${buyerSessionId}`;
  }

  async findByStoreAndBuyer(storeId: string, buyerSessionId: string): Promise<AgentConversation | null> {
    return this.conversations.get(this.key(storeId, buyerSessionId)) ?? null;
  }

  async save(conversation: AgentConversation): Promise<void> {
    this.conversations.set(this.key(conversation.storeId, conversation.buyerSessionId), conversation);
  }
}
