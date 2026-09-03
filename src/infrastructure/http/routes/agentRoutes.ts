import { Router } from "express";
import { IStoreRepository, IProductRepository } from "../../../domain/repositories/ICatalogRepositories";
import { IAgentConversationRepository } from "../../../domain/repositories/IAgentConversationRepository";
import { ChatWithAgentUseCase } from "../../../application/use-cases/ChatWithAgentUseCase";
import { AnthropicAgentService } from "../../services/AnthropicAgentService";

/**
 * Rutas públicas del agente de ventas: las usa el comprador desde el
 * catálogo web, no requieren autenticación de vendedor (igual que
 * publicCatalogPageRoute). El comprador se identifica por buyerSessionId,
 * un id que el frontend genera y guarda (ej. en localStorage) para
 * mantener el hilo de conversación entre mensajes.
 */
export function buildAgentRoutes(storeRepository: IStoreRepository, productRepository: IProductRepository, conversationRepository: IAgentConversationRepository) {
  const router = Router();
  const agentService = new AnthropicAgentService(productRepository);
  const chatWithAgentUseCase = new ChatWithAgentUseCase(storeRepository, conversationRepository, agentService);

  router.post("/catalogo/:slug/agente/chat", async (req, res, next) => {
    try {
      const { buyerSessionId, message } = req.body as { buyerSessionId?: string; message?: string };
      if (!buyerSessionId) {
        return res.status(400).json({ error: "buyerSessionId es requerido." });
      }

      const result = await chatWithAgentUseCase.execute({
        storeSlug: req.params.slug,
        buyerSessionId,
        message: message ?? "",
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
