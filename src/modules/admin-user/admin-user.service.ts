import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import {
  AdminRole,
  Prisma,
  type AdminUser,
} from '../../../generated/prisma/client';
import {
  type PaginatedResult,
  resolvePagination,
  resolveSortOrder,
  toPaginatedResult,
} from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { toAdminUserResponse } from './admin-user.mapper';
import type { AdminUserResponse } from './admin-user.types';
import type { ChangeAdminPasswordDto } from './dto/change-admin-password.dto';
import type { CreateAdminUserDto } from './dto/create-admin-user.dto';
import type { LoginAdminUserDto } from './dto/login-admin-user.dto';
import type { AdminUserProfileDto } from './dto/admin-user-profile.dto';
import type {
  AdminUserOrderByField,
  QueryAdminUserDto,
} from './dto/query-admin-user.dto';
import type { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@Injectable()
export class AdminUserService {
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

  private sanitizeAdminUser(user: AdminUser) {
    const { password, ...rest } = user;
    return rest;
  }

  private assertSuperAdmin(actorRole: AdminRole | undefined): void {
    if (actorRole !== AdminRole.SUPER_ADMIN) {
      throw new ForbiddenException('SUPER_ADMIN required');
    }
  }

  private async assertLastSuperAdminPreserved(input: {
    targetUserId: number;
    nextRole: AdminRole;
    nextIsActive: boolean;
  }): Promise<void> {
    const user = await this.prisma.adminUser.findUnique({
      where: { id: input.targetUserId },
      select: { role: true, isActive: true },
    });
    if (!user) {
      throw new NotFoundException('admin user not found');
    }

    const wasActiveSuperAdmin =
      user.role === AdminRole.SUPER_ADMIN && user.isActive;
    const willRemainActiveSuperAdmin =
      input.nextRole === AdminRole.SUPER_ADMIN && input.nextIsActive;

    if (!wasActiveSuperAdmin || willRemainActiveSuperAdmin) {
      return;
    }

    const remaining = await this.prisma.adminUser.count({
      where: {
        role: AdminRole.SUPER_ADMIN,
        isActive: true,
        NOT: { id: input.targetUserId },
      },
    });
    if (remaining < 1) {
      throw new BadRequestException(
        'cannot remove or disable the last active SUPER_ADMIN',
      );
    }
  }

  toExternalProfile(
    user: Omit<AdminUser, 'password'>,
  ): AdminUserProfileDto {
    return {
      id: user.id,
      employeeId: String(user.id),
      email: user.email,
      username: user.username,
      nickName: user.username,
      role: user.role,
      active: user.isActive,
      mustChangePassword: user.mustChangePassword,
    };
  }

  async getProfileByUserId(userId: number): Promise<AdminUserProfileDto> {
    const admin = await this.prisma.adminUser.findFirst({
      where: { id: userId, isActive: true },
    });
    if (!admin) {
      throw new UnauthorizedException('admin user not found or inactive');
    }
    return this.toExternalProfile(this.sanitizeAdminUser(admin));
  }

  async create(
    dto: CreateAdminUserDto,
    actorRole: AdminRole | undefined,
  ): Promise<{ admin: AdminUserResponse; generatedPassword: string }> {
    this.assertSuperAdmin(actorRole);

    const email = dto.email.trim();
    const username = dto.username.trim();
    if (!email || !username) {
      throw new BadRequestException('email and username are required');
    }

    const generatedPassword = this.generateInitialPassword();
    try {
      const row = await this.prisma.adminUser.create({
        data: {
          email,
          username,
          role: dto.role,
          isActive: dto.isActive ?? true,
          mustChangePassword: true,
          password: this.hashPassword(generatedPassword),
        },
      });
      return {
        admin: toAdminUserResponse(this.sanitizeAdminUser(row)),
        generatedPassword,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('admin email already exists');
      }
      throw error;
    }
  }

  async findPage(
    query: QueryAdminUserDto,
    actorRole: AdminRole | undefined,
  ): Promise<PaginatedResult<AdminUserResponse>> {
    this.assertSuperAdmin(actorRole);

    const { page, pageSize, skip, take } = resolvePagination(
      query.page,
      query.pageSize,
    );
    const where = this.buildWhere(query);
    const orderBy = this.buildOrderBy(query.orderBy, query.order);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.adminUser.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      this.prisma.adminUser.count({ where }),
    ]);
    return toPaginatedResult(
      rows.map((row) => toAdminUserResponse(this.sanitizeAdminUser(row))),
      total,
      page,
      pageSize,
    );
  }

  async findOne(
    id: number,
    actorRole: AdminRole | undefined,
  ): Promise<AdminUserResponse> {
    this.assertSuperAdmin(actorRole);

    const row = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`admin user ${id} not found`);
    }
    return toAdminUserResponse(this.sanitizeAdminUser(row));
  }

  async update(
    id: number,
    dto: UpdateAdminUserDto,
    actor: { userId: number; adminRole: AdminRole | undefined },
  ): Promise<AdminUserResponse> {
    this.assertSuperAdmin(actor.adminRole);

    const existing = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`admin user ${id} not found`);
    }

    if (dto.isActive === false && actor.userId === id) {
      throw new BadRequestException('cannot disable your own admin account');
    }

    const nextRole = dto.role ?? existing.role;
    const nextIsActive = dto.isActive ?? existing.isActive;
    await this.assertLastSuperAdminPreserved({
      targetUserId: id,
      nextRole,
      nextIsActive,
    });

    const data: Prisma.AdminUserUpdateInput = {};
    if (dto.email !== undefined) {
      data.email = dto.email.trim();
    }
    if (dto.username !== undefined) {
      data.username = dto.username.trim();
    }
    if (dto.role !== undefined) {
      data.role = dto.role;
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    try {
      const row = await this.prisma.adminUser.update({
        where: { id },
        data,
      });
      return toAdminUserResponse(this.sanitizeAdminUser(row));
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('admin email already exists');
      }
      throw error;
    }
  }

  async resetPassword(
    id: number,
    actorRole: AdminRole | undefined,
  ): Promise<{ admin: AdminUserResponse; generatedPassword: string }> {
    this.assertSuperAdmin(actorRole);

    const existing = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`admin user ${id} not found`);
    }

    const generatedPassword = this.generateInitialPassword();
    const row = await this.prisma.adminUser.update({
      where: { id },
      data: {
        password: this.hashPassword(generatedPassword),
        mustChangePassword: true,
      },
    });
    return {
      admin: toAdminUserResponse(this.sanitizeAdminUser(row)),
      generatedPassword,
    };
  }

  async changePassword(
    userId: number,
    dto: ChangeAdminPasswordDto,
  ): Promise<{ ok: true }> {
    const currentPassword = dto.currentPassword.trim();
    const newPassword = dto.newPassword.trim();
    if (!currentPassword || !newPassword) {
      throw new BadRequestException('currentPassword and newPassword are required');
    }

    const admin = await this.prisma.adminUser.findUnique({
      where: { id: userId },
    });
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('admin user not found or inactive');
    }

    if (!this.verifyPassword(currentPassword, admin.password)) {
      throw new UnauthorizedException('current password is incorrect');
    }

    await this.prisma.adminUser.update({
      where: { id: userId },
      data: {
        password: this.hashPassword(newPassword),
        mustChangePassword: false,
      },
    });
    return { ok: true };
  }

  async login(data: LoginAdminUserDto) {
    const email = data.email?.trim();
    const password = data.password?.trim();

    if (!email || !password) {
      throw new BadRequestException('email and password are required');
    }

    const admin = await this.prisma.adminUser.findFirst({
      where: { email, isActive: true },
    });
    if (!admin) {
      throw new UnauthorizedException('invalid email or password');
    }

    const verified = this.verifyPassword(password, admin.password);
    if (!verified) {
      throw new UnauthorizedException('invalid email or password');
    }

    const payload = {
      sub: admin.id,
      email: admin.email,
      username: admin.username,
      adminRole: admin.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: this.sanitizeAdminUser(admin),
      mustChangePassword: admin.mustChangePassword,
    };
  }

  private buildWhere(query: QueryAdminUserDto): Prisma.AdminUserWhereInput {
    const where: Prisma.AdminUserWhereInput = {};
    if (query.id != null) {
      where.id = query.id;
    }
    if (query.role != null) {
      where.role = query.role;
    }
    if (query.isActive != null) {
      where.isActive = query.isActive;
    }
    const keyword = query.keyword?.trim();
    if (keyword) {
      where.OR = [
        { email: { contains: keyword, mode: 'insensitive' } },
        { username: { contains: keyword, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private buildOrderBy(
    orderBy: AdminUserOrderByField | undefined,
    order: 'asc' | 'desc' | undefined,
  ): Prisma.AdminUserOrderByWithRelationInput {
    const field = orderBy ?? 'id';
    const direction = resolveSortOrder(order);
    return { [field]: direction };
  }
}
