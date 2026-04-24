export {};

declare global {
  namespace Express {
    interface Request {
      appClient?: import('../auth/request-app-client').RequestAppClient;
    }
  }
}
