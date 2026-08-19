import { IStoreVisitRepository } from "../../domain/repositories/ICatalogRepositories";

export class RecordStoreVisitUseCase {
  constructor(private readonly visitRepository: IStoreVisitRepository) {}

  async execute(storeId: string): Promise<void> {
    await this.visitRepository.record(storeId);
  }
}
