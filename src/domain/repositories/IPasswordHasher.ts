export interface IPasswordHasher {
  hash(plainPassword: string): Promise<string>;
  compare(plainPassword: string, hash: string): Promise<boolean>;
}

export interface ITokenService {
  generateAccessToken(payload: TokenPayload): string;
  generateRefreshToken(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
  verifyRefreshToken(token: string): TokenPayload;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}
