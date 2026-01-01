import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}
  async login(createAuthDto: CreateAuthDto) {
    const user = await this.usersService.findByEmail(createAuthDto.email);
    if(user.isActive===false){
      throw new UnauthorizedException('User is deactivated');
    }
    if (user && user.password === createAuthDto.password) {
      return await this.assignToken(user);
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async assignToken(user: any) {
   
    const payload = { username: user.email, sub: user.id, role: user.role,organization:user.organizationId,office:user.officeId };
    return {
      access_token: this.jwtService.sign(payload),
      role: user.role,
      id:payload.sub,
      organization:payload.organization,
      office:payload.office
    };
  }
}
