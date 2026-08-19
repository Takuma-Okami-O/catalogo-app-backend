import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { RegisterUserUseCase } from "../../../application/use-cases/RegisterUserUseCase";
import { LoginUseCase } from "../../../application/use-cases/LoginUseCase";
import { RefreshTokenUseCase } from "../../../application/use-cases/RefreshTokenUseCase";
import { InMemoryUserRepository } from "../../services/InMemoryUserRepository";
import { BcryptPasswordHasher } from "../../services/BcryptPasswordHasher";
import { JwtTokenService, JwtConfig } from "../../services/JwtTokenService";
import { asyncHandler } from "../middlewares/globalErrorHandler";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";

/**
 * Composition Root del módulo de autenticación.
 * `userRepository` es opcional: si no se pasa, usa memoria (desarrollo/tests).
 * En producción, server.ts inyecta PrismaUserRepository.
 */
export function buildAuthRoutes(jwtConfig: JwtConfig, userRepository?: IUserRepository): Router {
  const router = Router();

  const repository = userRepository ?? new InMemoryUserRepository();
  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService(jwtConfig);

  const registerUserUseCase = new RegisterUserUseCase(repository, passwordHasher);
  const loginUseCase = new LoginUseCase(repository, passwordHasher, tokenService);
  const refreshTokenUseCase = new RefreshTokenUseCase(tokenService, repository);

  const controller = new AuthController(registerUserUseCase, loginUseCase);

  router.post("/register", asyncHandler(controller.register));
  router.post("/login", asyncHandler(controller.login));
  router.post(
    "/refresh",
    asyncHandler(async (req, res) => {
      const result = await refreshTokenUseCase.execute(req.body.refreshToken);
      res.status(200).json({ success: true, data: result });
    })
  );

  return router;
}
