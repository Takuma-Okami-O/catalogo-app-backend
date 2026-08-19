import { PrismaClient } from "@prisma/client";
import { User } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? this.toDomain(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        storeName: user.storeName,
        role: user.role,
      },
      update: {
        email: user.email,
        passwordHash: user.passwordHash,
        storeName: user.storeName,
        role: user.role,
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(row: any): User {
    return User.create({
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      storeName: row.storeName,
      role: row.role,
      createdAt: row.createdAt,
    });
  }
}
