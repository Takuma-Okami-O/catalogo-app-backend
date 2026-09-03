import { AgentConversation } from "../entities/AgentConversation";

export interface IAgentConversationRepository {
  findByStoreAndBuyer(storeId: string, buyerSessionId: string): Promise<AgentConversation | null>;
  save(conversation: AgentConversation): Promise<void>;
}
