import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  const service = {
    login: jest.fn(),
    getPasswordReminder: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: service }],
    }).compile();

    controller = moduleRef.get<UserController>(UserController);
    jest.clearAllMocks();
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
