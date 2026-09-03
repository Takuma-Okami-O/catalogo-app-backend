import { AgentConversation } from "../entities/AgentConversation";
import { Store } from "../entities/Store";

export interface IAgentService {
  /** Procesa un turno de conversación y devuelve el texto de respuesta del agente. Muta `conversation`. */
  handleTurn(conversation: AgentConversation, store: Store, userMessage: string): Promise<string>;
}
