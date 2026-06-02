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

export type ExternalAccountProfile = {
  employeeId: string;
  email: string;
  username: string;
  cnName?: string;
  nickName?: string;
  active: boolean;
};

@Injectable()
export class UserService {
  private readonly toolLevelWeight: Record<'L1' | 'L2' | 'L3', number> = {
    L1: 1,
    L2: 2,
    L3: 3,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private generateInitialPassword(): string {
    return randomBytes(12).toString('hex');
  }

  private verifyPassword(
    plainPassword: string,
    storedPassword: string,
  ): boolean {
    const [salt, hash] = storedPassword.split(':');
    if (!salt || !hash) {
      return false;
    }

    const hashBytes = Uint8Array.from(Buffer.from(hash, 'hex'));
    const plainHashBuffer = scryptSync(plainPassword, salt, hashBytes.length);
    const plainHashBytes = Uint8Array.from(plainHashBuffer);
    return timingSafeEqual(hashBytes, plainHashBytes);
  }

  async create(data: CreateUserDto) {
    const email = data.email?.trim();
    const username = data.username?.trim();
    if (!email) {
      throw new BadRequestException('email is required');
    }
    if (!username) {
      throw new BadRequestException('username is required');
    }

    const employeeId =
      data.employeeId?.trim() ||
      `admin_${username}_${randomBytes(4).toString('hex')}`;
    const initialPassword = this.generateInitialPassword();
    const hashedPassword = this.hashPassword(initialPassword);
    const createdUser = await this.prisma.user.create({
      data: {
        employeeId,
        email,
        password: hashedPassword,
        username,
        mustChangePassword: true,
      },
    });

    const safeUser = { ...createdUser };
    delete safeUser.password;
    return {
      ...safeUser,
      generatedPassword: initialPassword,
    };
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
    if (email !== undefined && !email) {
      throw new BadRequestException('email cannot be empty');
    }
    if (username !== undefined && !username) {
      throw new BadRequestException('username cannot be empty');
    }
    if (password !== undefined && !password) {
      throw new BadRequestException('password cannot be empty');
    }
    const hashedPassword =
      password !== undefined ? this.hashPassword(password) : undefined;

    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          email,
          password: hashedPassword,
          username,
          mustChangePassword: password !== undefined ? false : undefined,
        },
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

  async findOrCreateByExternalAccount(profile: ExternalAccountProfile) {
    const employeeId = profile.employeeId.trim();
    if (!employeeId) {
      throw new BadRequestException('employeeId is required');
    }
    const email = profile.email?.trim();
    const username =
      profile.nickName?.trim() ||
      profile.cnName?.trim() ||
      profile.username?.trim() ||
      employeeId;
    if (!email) {
      throw new BadRequestException('email is required from external account');
    }

    const existing = await this.prisma.user.findUnique({
      where: { employeeId },
    });
    if (existing) {
      const updated = await this.prisma.user.update({
        where: { id: existing.id },
        data: { email, username },
      });
      return this.toSafeUser(updated);
    }

    const created = await this.prisma.user.create({
      data: {
        employeeId,
        email,
        username,
        password: this.hashPassword(this.generateInitialPassword()),
        mustChangePassword: false,
      },
    });
    return this.toSafeUser(created);
  }

  async signUserAccessToken(user: {
    id: number;
    email: string;
    username: string;
  }): Promise<string> {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      username: user.username,
    });
  }

  private toSafeUser<T extends { password: string }>(
    user: T,
  ): Omit<T, 'password'> {
    const safeUser = { ...user };
    delete safeUser.password;
    return safeUser;
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

    const safeUser = { ...user };
    delete safeUser.password;
    return {
      accessToken,
      user: safeUser,
      mustChangePassword: user.mustChangePassword,
    };
  }

  async getPasswordReminder(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mustChangePassword: true },
    });
    if (!user) {
      throw new NotFoundException(`user ${userId} not found`);
    }

    return {
      mustChangePassword: user.mustChangePassword,
      message: user.mustChangePassword
        ? '首次登录请尽快修改密码'
        : '密码状态正常，无需修改',
    };
  }

  /** 用户在指定 App 下通过 UserApp.role → RoleTool 可用的工具列表。 */
  async getAllowedToolsForApp(userId: number, appClientId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException(`user ${userId} not found`);
    }

    const userApp = await this.prisma.userApp.findUnique({
      where: {
        userId_appId: { userId, appId: appClientId },
      },
      include: {
        role: {
          include: {
            roleTools: {
              include: { tool: true },
              orderBy: { toolId: 'asc' },
            },
          },
        },
      },
    });
    if (!userApp) {
      return [];
    }

    const maxAllowedLevel = this.toolLevelWeight[userApp.role.allowToolLevel];
    return userApp.role.roleTools
      .map((mapping) => mapping.tool)
      .filter(
        (tool) => this.toolLevelWeight[tool.riskLevel] <= maxAllowedLevel,
      );
  }
}
