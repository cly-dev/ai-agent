import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  const service = {
    create: jest.fn(),
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
      password: 'pass123',
      username: 'alice',
      token: 'token-1',
    });
    const result = await controller.create({
      email: 'alice@example.com',
      password: 'pass123',
      username: 'alice',
      token: 'token-1',
    });
    expect(service.create).toHaveBeenCalledWith({
      email: 'alice@example.com',
      password: 'pass123',
      username: 'alice',
      token: 'token-1',
    });
    expect(result).toEqual({
      id: 1,
      email: 'alice@example.com',
      password: 'pass123',
      username: 'alice',
      token: 'token-1',
    });
  });

  it('delegates findAll', async () => {
    service.findAll.mockResolvedValue([{ id: 1, username: 'alice' }]);
    const result = await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([{ id: 1, username: 'alice' }]);
  });
});
