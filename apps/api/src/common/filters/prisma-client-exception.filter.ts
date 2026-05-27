// Port from apg-manager/apps/api/src/common/filters/prisma-client-exception.filter.ts
import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    switch (exception.code) {
      case 'P2002': {
        const status = HttpStatus.CONFLICT;
        response.status(status).json({
          statusCode: status,
          message: 'Dữ liệu đã tồn tại (trùng lặp ID hoặc mã).',
          error: 'Conflict',
        });
        break;
      }
      case 'P2003': {
        const status = HttpStatus.BAD_REQUEST;
        response.status(status).json({
          statusCode: status,
          message:
            'Không thể thao tác vì vẫn còn dữ liệu liên kết. Vui lòng xóa hoặc gỡ các bản ghi liên quan trước.',
          error: 'Bad Request',
        });
        break;
      }
      case 'P2025': {
        const status = HttpStatus.NOT_FOUND;
        response.status(status).json({
          statusCode: status,
          message: 'Không tìm thấy dữ liệu yêu cầu.',
          error: 'Not Found',
        });
        break;
      }
      default: {
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        this.logger.error(
          `Unhandled Prisma error ${exception.code}: ${exception.message}`,
          exception.stack,
        );
        response.status(status).json({
          statusCode: status,
          message: 'Lỗi cơ sở dữ liệu.',
          error: 'Internal Server Error',
        });
        break;
      }
    }
  }
}
