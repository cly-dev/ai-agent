import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(
    plainPassword: string,
    storedPassword: string,
  ): boolean {
    const [salt, hash] = storedPassword.split(':');
    if (!salt || !hash) {
      return false;
    }

    const hashBuffer = Buffer.from(hash, 'hex');
    const plainHashBuffer = scryptSync(plainPassword, salt, hashBuffer.length);
    return timingSafeEqual(hashBuffer, plainHashBuffer);
  }

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

    const hashedPassword = this.hashPassword(password);

    return this.prisma.user.create({
      data: { email, password: hashedPassword, username, token },
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

    const hashedPassword =
      password !== undefined ? this.hashPassword(password) : undefined;

    try {
      return await this.prisma.user.update({
        where: { id },
        data: { email, password: hashedPassword, username, token },
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

  async login(data: LoginUserDto) {
    const email = data.email?.trim();
    const password = data.password?.trim();

    if (!email || !password) {
      throw new BadRequestException('email and password are required');
    }

    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('invalid email or password');
    }

    const verified = this.verifyPassword(password, user.password);
    if (!verified) {
      throw new UnauthorizedException('invalid email or password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { token: accessToken },
    });

    const { password: _, ...safeUser } = user;
    return {
      accessToken,
      user: safeUser,
    };
  }
}
