import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/app.log' }),
        // Có thể cấu hình thêm transport để đẩy log sang Grafana Loki
      ],
    }),
  ],
  exports: [WinstonModule],
})
export class LoggingModule {}
