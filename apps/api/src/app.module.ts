import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from '@api/app.controller';
import { AppService } from '@api/app.service';
import { AuthModule } from '@api/core/auth/auth.module';
import configuration, { environmentFilePaths } from '@api/core/config/configuration';
import { validateEnvironment } from '@api/core/config/env.validation';
import { PrismaModule } from '@api/core/database/prisma.module';
import { HealthModule } from '@api/modules/health/health.module';
import { ProfilesModule } from '@api/modules/profiles/profiles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      envFilePath: environmentFilePaths,
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    ProfilesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
