import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Body,
  UseGuards,
  HttpCode,
  Header,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard';
import { AdmsService } from './adms.service';

@ApiTags('adms')
@Controller('iclock')
export class AdmsController {
  constructor(private readonly admsService: AdmsService) {}

  @Get('cdata')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  async getCdata(
    @Query('SN') serialNumber: string,
    @Query('options') options?: string,
  ) {
    if (options === 'all' && serialNumber) {
      await this.admsService.touchDevice(serialNumber);
      return this.admsService.getPushOptions(serialNumber);
    }

    return 'OK';
  }

  @Post('cdata')
  @HttpCode(200)
  @Header('Content-Type', 'text/plain; charset=utf-8')
  async postCdata(
    @Req() req: Request,
    @Query('SN') serialNumber: string,
    @Query('table') table?: string,
  ) {
    const body =
      typeof req.body === 'string'
        ? req.body
        : Buffer.isBuffer(req.body)
          ? req.body.toString('utf8')
          : '';

    if (table === 'ATTLOG' && body) {
      const count = await this.admsService.processAttLog(serialNumber, body);
      return `OK:${count}`;
    }

    await this.admsService.touchDevice(serialNumber);
    return 'OK';
  }

  @Get('getrequest')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  async getRequest(@Query('SN') serialNumber: string) {
    await this.admsService.touchDevice(serialNumber);
    return 'OK';
  }

  @Post('registry')
  @HttpCode(200)
  @Header('Content-Type', 'text/plain; charset=utf-8')
  async registry(
    @Req() req: Request,
    @Query('SN') serialNumber: string,
  ) {
    const body =
      typeof req.body === 'string'
        ? req.body
        : Buffer.isBuffer(req.body)
          ? req.body.toString('utf8')
          : '';

    await this.admsService.registerFromDevice(serialNumber, body);
    return 'OK';
  }

  @Post('devicecmd')
  @HttpCode(200)
  @Header('Content-Type', 'text/plain; charset=utf-8')
  async deviceCmd(@Body() body: string) {
    return 'OK';
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('devices')
  listDevices() {
    return this.admsService.listDevices();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('devices/register')
  registerDevice(
    @Body()
    body: {
      serialNumber: string;
      organizationId: number;
      name?: string;
    },
  ) {
    return this.admsService.registerDevice(
      body.serialNumber,
      body.organizationId,
      body.name,
    );
  }
}
