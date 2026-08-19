import { Request, Response } from "express";
import { RegisterUserUseCase } from "../../../application/use-cases/RegisterUserUseCase";
import { LoginUseCase } from "../../../application/use-cases/LoginUseCase";

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const { email, password, storeName } = req.body;

    // Nota: cualquier error lanzado aquí (ValidationError, UserAlreadyExistsError)
    // es capturado por asyncHandler y resuelto por el globalErrorHandler.
    const user = await this.registerUserUseCase.execute({ email, password, storeName });

    res.status(201).json({
      success: true,
      data: user.toPublicJSON(),
    });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const result = await this.loginUseCase.execute({ email, password });

    res.status(200).json({
      success: true,
      data: result,
    });
  };
}
