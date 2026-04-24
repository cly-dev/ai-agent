import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { Prisma, UserRole } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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
    const userType = data.userType;
    const userRole = data.userRole;

    if (!email) {
      throw new BadRequestException('email is required');
    }
    if (!username) {
      throw new BadRequestException('username is required');
    }

    const initialPassword = this.generateInitialPassword();
    const hashedPassword = this.hashPassword(initialPassword);
    const createdUser = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        userType,
        userRole,
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
    const userType = data.userType;
    const userRole = data.userRole;

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
          userType,
          userRole,
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
      userType: user.userType,
      userRole: user.userRole,
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

  async getAllowedToolsByUserRole(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { userRole: true },
    });

    if (!user) {
      throw new NotFoundException(`user ${userId} not found`);
    }

    if (!user.userRole) {
      return [];
    }

    const authzSource = process.env.AUTHZ_SOURCE?.toLowerCase();
    if (authzSource === 'legacy') {
      return this.getAllowedToolsBySkillGraph(user.userRole);
    }

    return this.getAllowedToolsByRole(user.userRole);
  }

  private async getAllowedToolsByRole(userRole: UserRole) {
    const roleName = this.resolveRoleName(userRole);
    if (!roleName) {
      return [];
    }
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
      include: {
        roleTools: {
          include: { tool: true },
          orderBy: { toolId: 'asc' },
        },
      },
    });
    if (!role) {
      return [];
    }
    const maxAllowedLevel = this.toolLevelWeight[role.allowToolLevel];
    return role.roleTools
      .map((mapping) => mapping.tool)
      .filter(
        (tool) => this.toolLevelWeight[tool.riskLevel] <= maxAllowedLevel,
      );
  }

  private async getAllowedToolsBySkillGraph(userRole: UserRole) {
    const legacyRoleName = this.resolveRoleName(userRole);
    if (!legacyRoleName) {
      return [];
    }

    const role = await this.prisma.role.findUnique({
      where: { name: legacyRoleName },
      include: {
        roleSkills: {
          include: {
            skill: {
              include: {
                skillTools: {
                  include: { tool: true },
                },
              },
            },
          },
        },
      },
    });

    if (!role) {
      return [];
    }

    const toolMap = new Map<number, unknown>();
    const maxAllowedLevel = this.toolLevelWeight[role.allowToolLevel];
    for (const roleSkill of role.roleSkills) {
      for (const skillTool of roleSkill.skill.skillTools) {
        const toolLevel = this.toolLevelWeight[skillTool.tool.riskLevel];
        if (toolLevel > maxAllowedLevel) {
          continue;
        }
        toolMap.set(skillTool.tool.id, skillTool.tool);
      }
    }

    return Array.from(toolMap.values());
  }

  private resolveRoleName(userRole: UserRole): string | null {
    if (userRole === UserRole.OPERATOR) {
      return 'operator';
    }
    if (userRole === UserRole.CUSTOMER_SERVICE) {
      return 'viewer';
    }
    if (userRole === UserRole.C_END_USER) {
      return 'viewer';
    }
    return null;
  }
}
