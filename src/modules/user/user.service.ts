import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    const email = data.email?.trim();
    const password = data.password?.trim();
    const username = data.username?.trim();
    const token = data.token?.trim();

    if (!email) {
      throw new BadRequestException('email is required');
    }
    if (!password) {
      throw new BadRequestException('password is required');
    }
    if (!username) {
      throw new BadRequestException('username is required');
    }

    return this.prisma.user.create({
      data: { email, password, username, token },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`user ${id} not found`);
    }
    return user;
  }

  async update(id: number, data: UpdateUserDto) {
    const email = data.email?.trim();
    const password = data.password?.trim();
    const username = data.username?.trim();
    const token =
      typeof data.token === 'string' ? data.token.trim() : data.token;

    if (email !== undefined && !email) {
      throw new BadRequestException('email cannot be empty');
    }
    if (username !== undefined && !username) {
      throw new BadRequestException('username cannot be empty');
    }
    if (password !== undefined && !password) {
      throw new BadRequestException('password cannot be empty');
    }
    if (token !== undefined && token !== null && !token) {
      throw new BadRequestException('token cannot be empty');
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data: { email, password, username, token },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`user ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`user ${id} not found`);
      }
      throw error;
    }
  }
}
