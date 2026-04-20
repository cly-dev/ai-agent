import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let prisma: {
    user: {
      create: jest.Mock;
      findMany: jest.Mock;
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
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new UserService(prisma as unknown as PrismaService);
  });

  it('creates user with trimmed fields', async () => {
    prisma.user.create.mockResolvedValue({
      id: 1,
      email: 'alice@example.com',
      password: 'pass123',
      username: 'alice',
      token: 'token-1',
    });

    const result = await service.create({
      email: '  alice@example.com  ',
      password: '  pass123  ',
      username: '  alice  ',
      token: '  token-1  ',
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'alice@example.com',
        password: 'pass123',
        username: 'alice',
        token: 'token-1',
      },
    });
    expect(result).toEqual({
      id: 1,
      email: 'alice@example.com',
      password: 'pass123',
      username: 'alice',
      token: 'token-1',
    });
  });

  it('throws bad request for empty password', async () => {
    await expect(
      service.create({
        email: 'alice@example.com',
        password: '   ',
        username: 'alice',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws bad request for empty email', async () => {
    await expect(
      service.create({ email: '   ', password: 'pass123', username: 'alice' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws bad request for empty username', async () => {
    await expect(
      service.create({
        email: 'alice@example.com',
        password: 'pass123',
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
});
