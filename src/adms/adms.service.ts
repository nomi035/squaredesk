import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { AttendanceService } from 'src/attendance/attendance.service';
import { User } from 'src/user/entities/user.entity';
import { BiometricDevice } from './entities/biometric-device.entity';
import { DevicePunchLog } from './entities/device-punch-log.entity';

@Injectable()
export class AdmsService {
  private readonly logger = new Logger(AdmsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly attendanceService: AttendanceService,
    @InjectRepository(BiometricDevice)
    private readonly deviceRepository: Repository<BiometricDevice>,
    @InjectRepository(DevicePunchLog)
    private readonly punchLogRepository: Repository<DevicePunchLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private generateCode(length = 16): string {
    return randomBytes(length).toString('hex').slice(0, 32);
  }

  private getPushVersion(): string {
    return this.configService.get<string>('ADMS_PUSH_VERSION') ?? '3.1.2';
  }

  private buildPushServerConfig(device: BiometricDevice): string {
    if (!device.sessionId) {
      device.sessionId = this.generateCode();
    }

    return [
      `ServerVersion=${this.getPushVersion()}`,
      'ServerName=medaxis',
      `PushVersion=${this.getPushVersion()}`,
      'ErrorDelay=60',
      'RequestDelay=30',
      'TransTimes=00:00;14:05',
      'TransInterval=1',
      'TransTables=AttLog OpLog',
      'Realtime=1',
      `SessionID=${device.sessionId}`,
      'TimeoutSec=60',
    ].join('\r\n');
  }

  async getCdataResponse(
    serialNumber: string,
    options?: string,
  ): Promise<string> {
    if (options !== 'all' || !serialNumber) {
      return 'OK';
    }

    const device = await this.touchDevice(serialNumber);
    if (!device?.registryCode) {
      return 'OK';
    }

    if (!device.sessionId) {
      device.sessionId = this.generateCode();
      await this.deviceRepository.save(device);
    }

    return [
      'registry=ok',
      `RegistryCode=${device.registryCode}`,
      `ServerVersion=${this.getPushVersion()}`,
      'ServerName=medaxis',
      `PushProtVer=${this.getPushVersion()}`,
      'ErrorDelay=60',
      'RequestDelay=30',
      'TransTimes=00:00;14:05',
      'TransInterval=1',
      'TransTables=AttLog OpLog',
      'Realtime=1',
      `SessionID=${device.sessionId}`,
      'TimeoutSec=60',
    ].join('\r\n');
  }

  async getPushConfig(serialNumber: string): Promise<string> {
    const device = await this.touchDevice(serialNumber);
    if (!device?.registryCode) {
      return 'OK';
    }

    if (!device.sessionId) {
      device.sessionId = this.generateCode();
    }

    await this.deviceRepository.save(device);
    return this.buildPushServerConfig(device);
  }

  async touchDevice(serialNumber: string): Promise<BiometricDevice | null> {
    if (!serialNumber) {
      return null;
    }

    try {
      let device = await this.deviceRepository.findOne({
        where: { serialNumber },
      });

      if (!device) {
        const organizationId = Number(
          this.configService.get<string>('ADMS_DEFAULT_ORGANIZATION_ID'),
        );

        if (
          this.configService.get<string>('ADMS_AUTO_REGISTER') !== 'true' ||
          !organizationId
        ) {
          this.logger.warn(
            `Unknown device ${serialNumber}. Set ADMS_AUTO_REGISTER=true and ADMS_DEFAULT_ORGANIZATION_ID.`,
          );
          return null;
        }

        device = await this.deviceRepository.save(
          this.deviceRepository.create({
            serialNumber,
            organizationId,
            name: `Device ${serialNumber}`,
          }),
        );
        this.logger.log(
          `Auto-registered device ${serialNumber} for org ${organizationId}`,
        );
      }

      device.lastSeenAt = new Date();
      return this.deviceRepository.save(device);
    } catch (error) {
      this.logger.error(
        `Failed to touch device ${serialNumber}: ${error?.message ?? error}`,
      );
      return null;
    }
  }

  async processAttLog(serialNumber: string, body: string): Promise<number> {
    const device = await this.touchDevice(serialNumber);
    if (!device) {
      return 0;
    }

    const lines = body
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    let processed = 0;

    for (const line of lines) {
      const handled = await this.processAttLogLine(device, line);
      if (handled) {
        processed += 1;
      }
    }

    return processed;
  }

  private async processAttLogLine(
    device: BiometricDevice,
    line: string,
  ): Promise<boolean> {
    const parts = line.split('\t');
    if (parts.length < 2) {
      this.logger.warn(`Skipping invalid ATTLOG line: ${line}`);
      return false;
    }

    const devicePin = parts[0].trim();
    const punchTime = parts[1].trim();
    const status = parts.length > 2 ? Number(parts[2]) : NaN;

    const existing = await this.punchLogRepository.findOne({
      where: {
        deviceSn: device.serialNumber,
        devicePin,
        punchTime,
      },
    });

    if (existing) {
      return false;
    }

    const user = await this.userRepository.findOne({
      where: {
        employeeId: devicePin,
        organizationId: device.organizationId,
      },
    });

    if (!user) {
      await this.punchLogRepository.save(
        this.punchLogRepository.create({
          deviceSn: device.serialNumber,
          devicePin,
          punchTime,
          status: Number.isNaN(status) ? null : status,
          result: 'user_not_found',
        }),
      );
      this.logger.warn(
        `No user for device PIN ${devicePin} in org ${device.organizationId}`,
      );
      return true;
    }

    const punchAt = this.parsePunchTime(punchTime);
    if (!punchAt) {
      await this.punchLogRepository.save(
        this.punchLogRepository.create({
          deviceSn: device.serialNumber,
          devicePin,
          punchTime,
          status: Number.isNaN(status) ? null : status,
          userId: user.id,
          result: 'invalid_time',
        }),
      );
      return true;
    }

    const attendance = await this.attendanceService.recordBiometricPunch(
      user.id,
      punchAt,
      status,
    );

    await this.punchLogRepository.save(
      this.punchLogRepository.create({
        deviceSn: device.serialNumber,
        devicePin,
        punchTime,
        status: Number.isNaN(status) ? null : status,
        userId: user.id,
        attendanceId: attendance?.id ?? null,
        result: attendance ? 'processed' : 'skipped',
      }),
    );

    return true;
  }

  private parsePunchTime(value: string): Date | null {
    const normalized = value.trim().replace('T', ' ');
    const match = normalized.match(
      /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/,
    );

    if (!match) {
      return null;
    }

    const [, year, month, day, hour, minute, second] = match;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );
  }

  async registerFromDevice(serialNumber: string, body: string): Promise<string> {
    if (body) {
      this.logger.log(`Device registry from ${serialNumber}: ${body.slice(0, 200)}`);
    }

    const deviceName = body.match(/~?DeviceName=([^,]+)/)?.[1];
    let device = await this.touchDevice(serialNumber);

    if (!device) {
      return 'OK';
    }

    if (!device.registryCode) {
      device.registryCode = this.generateCode();
    }

    if (deviceName) {
      device.name = deviceName;
    }

    device = await this.deviceRepository.save(device);
    this.logger.log(`Device ${serialNumber} registry code assigned`);

    return `RegistryCode=${device.registryCode}`;
  }

  async registerDevice(serialNumber: string, organizationId: number, name?: string) {
    const existing = await this.deviceRepository.findOne({
      where: { serialNumber },
    });

    if (existing) {
      existing.organizationId = organizationId;
      existing.name = name ?? existing.name;
      return this.deviceRepository.save(existing);
    }

    return this.deviceRepository.save(
      this.deviceRepository.create({
        serialNumber,
        organizationId,
        name: name ?? `Device ${serialNumber}`,
      }),
    );
  }

  listDevices() {
    return this.deviceRepository.find({ order: { id: 'DESC' } });
  }
}
