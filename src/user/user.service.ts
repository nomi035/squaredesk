import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { S3Service } from 'src/storage/s3.service';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDocument } from './entities/user-document.entity';
import { Role, User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(UserDocument)
    private readonly userDocumentRepository: Repository<UserDocument>,
    private readonly s3Service: S3Service,
  ) {}

  parseCreateUserBody(body: Record<string, string>): CreateUserDto {
    return {
      firstName: body.firstName,
      lastName: body.lastName,
      password: body.password,
      email: body.email,
      phone: body.phone,
      address1: body.address1,
      address2: body.address2,
      city: body.city,
      state: body.state,
      zip: body.zip,
      ptoDays: body.ptoDays ? Number(body.ptoDays) : undefined,
      emergencyName: body.emergencyName,
      emergencyPhone: body.emergencyPhone,
      emergencyRelation: body.emergencyRelation,
      role: body.role as Role,
      salaryAmount: body.salaryAmount ? Number(body.salaryAmount) : undefined,
      employeeId: body.employeeId,
      bloodGroup: body.bloodGroup,
      department: body.department,
      cnicNumber: body.cnicNumber,
      reportsToId: body.reportsToId ? Number(body.reportsToId) : undefined,
      designation: body.designation,
    };
  }

  parseUpdateUserBody(body: Record<string, unknown> = {}): UpdateUserDto {
    const dto: UpdateUserDto = {};

    const asString = (value: unknown): string | undefined => {
      if (value === undefined || value === null) {
        return undefined;
      }
      return String(value);
    };

    const setString = (key: keyof UpdateUserDto, value: unknown) => {
      const normalized = asString(value);
      if (normalized === undefined) {
        return;
      }
      (dto as Record<string, unknown>)[key] =
        normalized === 'null' || normalized === 'undefined' ? null : normalized;
    };

    const setBoolean = (key: keyof UpdateUserDto, value: unknown) => {
      if (value === undefined) {
        return;
      }
      if (typeof value === 'boolean') {
        (dto as Record<string, unknown>)[key] = value;
        return;
      }
      const normalized = asString(value)?.trim().toLowerCase();
      if (normalized === 'true') {
        (dto as Record<string, unknown>)[key] = true;
      } else if (normalized === 'false') {
        (dto as Record<string, unknown>)[key] = false;
      }
    };

    const setNumber = (key: keyof UpdateUserDto, value: unknown) => {
      const normalized = asString(value);
      if (
        normalized === undefined ||
        normalized === '' ||
        normalized === 'null' ||
        normalized === 'undefined'
      ) {
        return;
      }
      const parsed = Number(normalized);
      if (Number.isFinite(parsed)) {
        (dto as Record<string, unknown>)[key] = parsed;
      }
    };

    setString('firstName', body.firstName);
    setString('lastName', body.lastName);
    setString('password', body.password);
    setString('email', body.email);
    setString('phone', body.phone);
    setString('address1', body.address1);
    setString('address2', body.address2);
    setString('city', body.city);
    setString('state', body.state);
    setString('zip', body.zip);
    setNumber('ptoDays', body.ptoDays);
    setString('emergencyName', body.emergencyName);
    setString('emergencyPhone', body.emergencyPhone);
    setString('emergencyRelation', body.emergencyRelation);
    const role = asString(body.role);
    if (role !== undefined && role !== '' && role !== 'undefined') {
      dto.role = role as Role;
    }
    setNumber('salaryAmount', body.salaryAmount);
    setString('employeeId', body.employeeId);
    setString('bloodGroup', body.bloodGroup);
    setString('department', body.department);
    setString('cnicNumber', body.cnicNumber);
    setString('designation', body.designation);
    setBoolean('isActive', body.isActive);
    if (body.reportsToId !== undefined) {
      const reportsToId = asString(body.reportsToId);
      dto.reportsToId =
        reportsToId === '' || reportsToId === 'null' || reportsToId === 'undefined'
          ? null
          : Number(reportsToId);
      if (dto.reportsToId !== null && !Number.isFinite(dto.reportsToId as number)) {
        delete dto.reportsToId;
      }
    }

    return dto;
  }

  private mapUserSummary(user: User) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      profilePic: user.profilePic,
    };
  }

  async validateReportsTo(
    reportsToId: number | undefined,
    userId: number | undefined,
    organizationId: number,
  ) {
    if (!reportsToId) {
      return;
    }

    if (userId && reportsToId === userId) {
      throw new BadRequestException('A user cannot report to themselves');
    }

    const manager = await this.usersRepository.findOne({
      where: { id: reportsToId, organizationId },
    });
    if (!manager) {
      throw new BadRequestException('Manager must belong to the same organization');
    }
  }

  parseDocumentNames(value?: string): string[] {
    if (!value?.trim()) {
      return [];
    }

    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // fall through to comma-separated parsing
    }

    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async create(createUserDto: CreateUserDto) {
    return this.usersRepository.save(createUserDto);
  }

  async createWithFiles(
    createUserDto: CreateUserDto,
    profilePic?: Express.Multer.File,
    documents: Express.Multer.File[] = [],
    documentNames: string[] = [],
  ) {
    await this.validateReportsTo(
      createUserDto.reportsToId,
      undefined,
      createUserDto.organizationId,
    );

    const user = await this.usersRepository.save(createUserDto);
    const folderBase = `organizations/${createUserDto.organizationId}/users/${user.id}`;

    if (profilePic) {
      const profilePicUrl = await this.s3Service.uploadFile(
        profilePic,
        `${folderBase}/profile`,
      );
      await this.usersRepository.update(user.id, { profilePic: profilePicUrl });
      user.profilePic = profilePicUrl;
    }

    const savedDocuments: UserDocument[] = [];
    for (let index = 0; index < documents.length; index += 1) {
      const file = documents[index];
      const name =
        documentNames[index]?.trim() ||
        file.originalname ||
        `Document ${index + 1}`;
      const url = await this.s3Service.uploadFile(
        file,
        `${folderBase}/documents`,
      );
      const document = await this.userDocumentRepository.save({
        userId: user.id,
        name,
        url,
      });
      savedDocuments.push(document);
    }

    user.documents = savedDocuments;
    return this.findOne(user.id);
  }

  async findAll() {
    return this.usersRepository.find({ relations: ['documents'] });
  }

  async findAllByOrganization(role: Role, organizationId: number) {
    return this.usersRepository.find({
      where: {
        role,
        organization: {
          id: organizationId,
        },
      },
      relations: ['documents','reportsTo','shifts'],
    });
  }

  async findAllByOffice(role: Role, officeId: number) {
    return this.usersRepository.findAndCount({
      where: {
        role,
        organizationId: officeId,
      },
      relations: ['documents'],
    });
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({ where: [{ email }, { employeeId: email }] });
  }

  async findOne(id: number) {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['documents', 'reportsTo'],
    });
  }

  async getReportingStructure(organizationId: number) {
    const users = await this.usersRepository.find({
      where: { organizationId, isActive: true },
      relations: ['reportsTo'],
      order: { firstName: 'ASC' },
    });

    const reporting = users.map((user) => ({
      user: this.mapUserSummary(user),
      reportsTo: user.reportsTo ? this.mapUserSummary(user.reportsTo) : null,
    }));

    const withoutManager = reporting
      .filter((item) => !item.reportsTo)
      .map((item) => item.user);

    const withManager = reporting.filter((item) => item.reportsTo);

    return {
      totalUsers: users.length,
      withManagerCount: withManager.length,
      withoutManagerCount: withoutManager.length,
      reporting,
      withoutManager,
    };
  }

  async getUserReporting(id: number, organizationId: number) {
    const user = await this.usersRepository.findOne({
      where: { id, organizationId },
      relations: ['reportsTo', 'directReports'],
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return {
      user: this.mapUserSummary(user),
      reportsTo: user.reportsTo ? this.mapUserSummary(user.reportsTo) : null,
      directReports: (user.directReports ?? []).map((report) =>
        this.mapUserSummary(report),
      ),
    };
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    if (updateUserDto.reportsToId !== undefined) {
      const existing = await this.findOne(id);
      await this.validateReportsTo(
        updateUserDto.reportsToId ?? undefined,
        id,
        existing.organizationId,
      );
    }

    return this.usersRepository.update(id, updateUserDto);
  }

  async updateWithFiles(
    id: number,
    updateUserDto: UpdateUserDto,
    profilePic?: Express.Multer.File,
    documents: Express.Multer.File[] = [],
    documentNames: string[] = [],
  ) {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException(`User ${id} not found`);
    }

    if (updateUserDto.reportsToId !== undefined) {
      await this.validateReportsTo(
        updateUserDto.reportsToId ?? undefined,
        id,
        existing.organizationId,
      );
    }

    if (Object.keys(updateUserDto).length > 0) {
      await this.usersRepository.update(id, updateUserDto);
    }

    const folderBase = `organizations/${existing.organizationId}/users/${id}`;

    if (profilePic?.buffer?.length) {
      if (existing.profilePic) {
        await this.s3Service.deleteFileByUrl(existing.profilePic);
      }
      const profilePicUrl = await this.s3Service.uploadFile(
        profilePic,
        `${folderBase}/profile`,
      );
      await this.usersRepository.update(id, { profilePic: profilePicUrl });
    }

    for (let index = 0; index < documents.length; index += 1) {
      const file = documents[index];
      if (!file?.buffer?.length) {
        continue;
      }
      const name =
        documentNames[index]?.trim() ||
        file.originalname ||
        `Document ${index + 1}`;
      const url = await this.s3Service.uploadFile(
        file,
        `${folderBase}/documents`,
      );
      await this.userDocumentRepository.save({
        userId: id,
        name,
        url,
      });
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    if (user?.profilePic) {
      await this.s3Service.deleteFileByUrl(user.profilePic);
    }
    if (user?.documents?.length) {
      for (const document of user.documents) {
        await this.s3Service.deleteFileByUrl(document.url);
      }
    }
    return this.usersRepository.delete(id);
  }

  async removeDocument(userId: number, documentId: number) {
    const document = await this.userDocumentRepository.findOne({
      where: { id: documentId, userId },
    });
    if (!document) {
      throw new NotFoundException(
        `Document ${documentId} not found for user ${userId}`,
      );
    }

    await this.s3Service.deleteFileByUrl(document.url);
    await this.userDocumentRepository.delete(documentId);

    return this.findOne(userId);
  }
}
