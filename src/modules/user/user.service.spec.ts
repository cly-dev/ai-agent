import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  const jwtService = {
    signAsync: jest.fn(),
  } as unknown as JwtService;
  let prisma: {
    user: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      user: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    (jwtService.signAsync as jest.Mock).mockReset();
    service = new UserService(prisma as unknown as PrismaService, jwtService);
  });

  it('creates user with trimmed fields', async () => {
    prisma.user.create.mockImplementation(async ({ data }) => ({
      id: 1,
      ...data,
    }));

    const result = await service.create({
      email: '  alice@example.com  ',
      username: '  alice  ',
    });

    expect(prisma.user.create).toHaveBeenCalled();
    const createArg = prisma.user.create.mock.calls[0][0];
    expect(createArg.data.email).toBe('alice@example.com');
    expect(createArg.data.username).toBe('alice');
    expect(createArg.data.mustChangePassword).toBe(true);
    expect(createArg.data.password).toContain(':');
    expect(result.generatedPassword).toEqual(expect.any(String));
    expect(result.generatedPassword.length).toBeGreaterThanOrEqual(12);
    expect(result).toEqual({
      id: 1,
      email: 'alice@example.com',
      username: 'alice',
      roleId: undefined,
      mustChangePassword: true,
      generatedPassword: expect.any(String),
    });
  });

  it('hashes password on update when provided', async () => {
    prisma.user.update.mockImplementation(async ({ data }) => ({
      id: 1,
      ...data,
    }));
    const result = await service.update(1, { password: 'newPass123' });
    const updateArg = prisma.user.update.mock.calls[0][0];
    expect(updateArg.data.password).not.toBe('newPass123');
    expect(updateArg.data.password).toContain(':');
    expect(result.password).toEqual(expect.any(String));
  });

  it('throws bad request for empty email', async () => {
    await expect(service.create({ email: '   ', username: 'alice' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws bad request for empty username', async () => {
    await expect(
      service.create({
        email: 'alice@example.com',
        username: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws not found for missing user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.findOne(404)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('maps prisma P2025 to not found on update', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('missing', {
      code: 'P2025',
      clientVersion: 'test',
    });
    prisma.user.update.mockRejectedValue(prismaError);
    await expect(service.update(1, { username: 'new' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns user without password on successful login', async () => {
    const salt = 'abcd1234abcd1234abcd1234abcd1234';
    const hash = 'f'.repeat(128);
    prisma.user.findFirst.mockResolvedValue({
      id: 1,
      email: 'alice@example.com',
      username: 'alice',
      mustChangePassword: true,
      password: `${salt}:${hash}`,
    });

    (jwtService.signAsync as jest.Mock).mockResolvedValue('jwt-token-1');

    const verifySpy = jest
      .spyOn(service as any, 'verifyPassword')
      .mockReturnValue(true);
    const result = await service.login({
      email: 'alice@example.com',
      password: 'pass123',
    });

    expect(verifySpy).toHaveBeenCalled();
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 1,
      email: 'alice@example.com',
      username: 'alice',
    });
    expect(result).toEqual({
      accessToken: 'jwt-token-1',
      user: {
        id: 1,
        email: 'alice@example.com',
        username: 'alice',
        mustChangePassword: true,
      },
      mustChangePassword: true,
    });
  });

  it('throws unauthorized on invalid login', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(
      service.login({ email: 'alice@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
