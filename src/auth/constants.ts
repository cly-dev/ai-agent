export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'dev-jwt-secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
