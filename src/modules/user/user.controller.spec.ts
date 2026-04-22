import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  const service = {
    create: jest.fn(),
    login: jest.fn(),
    getPasswordReminder: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: service }],
    }).compile();

    controller = moduleRef.get<UserController>(UserController);
    jest.clearAllMocks();
  });

  it('delegates create', async () => {
    service.create.mockResolvedValue({
      id: 1,
      email: 'alice@example.com',
      username: 'alice',
      mustChangePassword: true,
      generatedPassword: 'init-pass-123',
    });
    const result = await controller.create({
      email: 'alice@example.com',
      username: 'alice',
    });
    expect(service.create).toHaveBeenCalledWith({
      email: 'alice@example.com',
      username: 'alice',
    });
    expect(result).toEqual({
      id: 1,
      email: 'alice@example.com',
      username: 'alice',
      mustChangePassword: true,
      generatedPassword: 'init-pass-123',
    });
  });

  it('delegates findAll', async () => {
    service.findAll.mockResolvedValue([{ id: 1, username: 'alice' }]);
    const result = await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([{ id: 1, username: 'alice' }]);
  });

  it('delegates login', async () => {
    service.login.mockResolvedValue({
      accessToken: 'jwt-token-1',
      user: {
        id: 1,
        email: 'alice@example.com',
        username: 'alice',
        mustChangePassword: true,
      },
      mustChangePassword: true,
    });
    const result = await controller.login({
      email: 'alice@example.com',
      password: 'pass123',
    });
    expect(service.login).toHaveBeenCalledWith({
      email: 'alice@example.com',
      password: 'pass123',
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
});
