import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionModule } from 'src/permission/permission.module';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), PermissionModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService] // Exporting the service to be used in other modules
})
export class UserModule {}
