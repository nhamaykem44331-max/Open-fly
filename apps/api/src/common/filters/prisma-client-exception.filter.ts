// Port from apg-manager/apps/api/src/common/filters/prisma-client-exception.filter.ts
import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';

type PrismaKnownRequestError = Error & {
  code?: string;
};

@Catch()
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: PrismaKnownRequestError, host: ArgumentsHost) {
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
      default:
        super.catch(exception, host);
        break;
    }
  }
}
