import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionModule } from 'src/permission/permission.module';
import { StorageModule } from 'src/storage/storage.module';
import { UserDocument } from './entities/user-document.entity';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserDocument]),
    PermissionModule,
    StorageModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService] // Exporting the service to be used in other modules
})
export class UserModule {}
