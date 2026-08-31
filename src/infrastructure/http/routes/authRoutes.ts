import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { RegisterUserUseCase } from "../../../application/use-cases/RegisterUserUseCase";
import { LoginUseCase } from "../../../application/use-cases/LoginUseCase";
import { RefreshTokenUseCase } from "../../../application/use-cases/RefreshTokenUseCase";
import { RequestPasswordResetUseCase } from "../../../application/use-cases/RequestPasswordResetUseCase";
import { ResetPasswordUseCase } from "../../../application/use-cases/ResetPasswordUseCase";
import { InMemoryUserRepository } from "../../services/InMemoryUserRepository";
import { BcryptPasswordHasher } from "../../services/BcryptPasswordHasher";
import { JwtTokenService, JwtConfig } from "../../services/JwtTokenService";
import { ResendEmailSender } from "../../services/ResendEmailSender";
import { asyncHandler } from "../middlewares/globalErrorHandler";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IEmailSender } from "../../../domain/repositories/IEmailSender";
import { ValidationError } from "../../../domain/errors/AppError";

/**
 * Composition Root del módulo de autenticación.
 * `userRepository` es opcional: si no se pasa, usa memoria (desarrollo/tests).
 * En producción, server.ts inyecta PrismaUserRepository.
 */
export function buildAuthRoutes(
  jwtConfig: JwtConfig,
  userRepository?: IUserRepository,
  emailSender?: IEmailSender
): Router {
  const router = Router();

  const repository = userRepository ?? new InMemoryUserRepository();
  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService(jwtConfig);
  const mailer =
    emailSender ??
    (process.env.RESEND_API_KEY
      ? new ResendEmailSender(process.env.RESEND_API_KEY, process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev")
      : null);

  const registerUserUseCase = new RegisterUserUseCase(repository, passwordHasher);
  const loginUseCase = new LoginUseCase(repository, passwordHasher, tokenService);
  const refreshTokenUseCase = new RefreshTokenUseCase(tokenService, repository);
  const resetPasswordUseCase = new ResetPasswordUseCase(repository, passwordHasher);

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

  router.post(
    "/forgot-password",
    asyncHandler(async (req, res) => {
      if (!mailer) {
        throw new ValidationError(
          "El envío de correos no está configurado todavía en el servidor (falta RESEND_API_KEY)."
        );
      }
      if (!req.body.email || typeof req.body.email !== "string") {
        throw new ValidationError("Debes indicar tu correo.");
      }
      const requestPasswordResetUseCase = new RequestPasswordResetUseCase(repository, mailer);
      await requestPasswordResetUseCase.execute(req.body.email);
      // Siempre respondemos igual, exista o no ese correo (ver comentario
      // en RequestPasswordResetUseCase).
      res.status(200).json({
        success: true,
        message: "Si ese correo está registrado, te enviamos un código para recuperar tu contraseña.",
      });
    })
  );

  router.post(
    "/reset-password",
    asyncHandler(async (req, res) => {
      await resetPasswordUseCase.execute({
        email: req.body.email,
        code: req.body.code,
        newPassword: req.body.newPassword,
      });
      res.status(200).json({ success: true, message: "Tu contraseña se actualizó correctamente." });
    })
  );

  return router;
}
