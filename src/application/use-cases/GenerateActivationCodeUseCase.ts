import { randomBytes } from "node:crypto";
import { IPremiumCodeRepository } from "../../domain/repositories/ICatalogRepositories";

export interface GenerateActivationCodeOutput {
  code: string;
  durationDays: number;
}

export class GenerateActivationCodeUseCase {
  constructor(private readonly codeRepository: IPremiumCodeRepository) {}

  async execute(durationDays: number = 30): Promise<GenerateActivationCodeOutput> {
    const raw = randomBytes(4).toString("hex").toUpperCase();
    const code = `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
    await this.codeRepository.create(code, durationDays);
    return { code, durationDays };
  }
}
