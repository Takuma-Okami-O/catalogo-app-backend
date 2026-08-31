export interface IEmailSender {
  sendPasswordResetEmail(input: { to: string; storeName: string; code: string }): Promise<void>;
}
