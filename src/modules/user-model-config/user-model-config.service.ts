import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserModelConfigDto } from './dto/create-user-model-config.dto';
import { UpdateUserModelConfigDto } from './dto/update-user-model-config.dto';

@Injectable()
export class UserModelConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserModelConfigDto) {
    const provider = data.provider?.trim();
    const model = data.model?.trim();
    const apiKey = data.apiKey?.trim();
    const baseUrl = data.baseUrl?.trim();

    if (!provider || !model || !apiKey) {
      throw new BadRequestException('provider, model and apiKey are required');
    }

    return this.prisma.userLlmModelConfig.create({
      data: {
        userId: data.userId,
        provider,
        model,
        apiKey,
        baseUrl,
        temperature: data.temperature,
        maxTokens: data.maxTokens,
        enabled: data.enabled ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.userLlmModelConfig.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findByUser(userId: number) {
    return this.prisma.userLlmModelConfig.findMany({
      where: { userId },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const record = await this.prisma.userLlmModelConfig.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`model config ${id} not found`);
    }
    return record;
  }

  async update(id: number, data: UpdateUserModelConfigDto) {
    const provider = data.provider?.trim();
    const model = data.model?.trim();
    const apiKey = data.apiKey?.trim();
    const baseUrl =
      typeof data.baseUrl === 'string' ? data.baseUrl.trim() : data.baseUrl;

    if (provider !== undefined && !provider) {
      throw new BadRequestException('provider cannot be empty');
    }
    if (model !== undefined && !model) {
      throw new BadRequestException('model cannot be empty');
    }
    if (apiKey !== undefined && !apiKey) {
      throw new BadRequestException('apiKey cannot be empty');
    }
    if (baseUrl !== undefined && baseUrl !== null && !baseUrl) {
      throw new BadRequestException('baseUrl cannot be empty');
    }

    try {
      return await this.prisma.userLlmModelConfig.update({
        where: { id },
        data: {
          provider,
          model,
          apiKey,
          baseUrl,
          temperature: data.temperature,
          maxTokens: data.maxTokens,
          enabled: data.enabled,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`model config ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.userLlmModelConfig.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`model config ${id} not found`);
      }
      throw error;
    }
  }
}
