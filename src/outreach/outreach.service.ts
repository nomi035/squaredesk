import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOutreachCommentDto } from './dto/create-outreach-comment.dto';
import { UpdateOutreachDto } from './dto/update-outreach.dto';
import { OutreachComment } from './entities/outreach-comment.entity';
import { Outreach } from './entities/outreach.entity';

type PsychiatryCsvRow = {
  NPI: string;
  Name: string;
  'Enumeration Date': string;
  Taxonomy: string;
  City: string;
  State: string;
  'Postal Code': string;
  'Practice Phone': string;
  'Authorized First Name': string;
  'Authorized Last Name': string;
  'Authorized Phone': string;
  Disposition: string;
  Comment: string;
  Email?: string;
  'Email Address'?: string;
  'email addresses'?: string;
  'Email Addresses'?: string;
} & Record<string, any>;

import { ProviderFile } from './entities/provider-file.entity';

@Injectable()
export class OutreachService {
  constructor(
    @InjectRepository(Outreach)
    private readonly outreachRepository: Repository<Outreach>,
    @InjectRepository(OutreachComment)
    private readonly outreachCommentRepository: Repository<OutreachComment>,
    @InjectRepository(ProviderFile)
    private readonly providerFileRepository: Repository<ProviderFile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  private parseEnumerationDate(value: string): Date | null {
    if (!value?.trim()) {
      return null;
    }

    // Handle YYYY-MM-DD (ISO format from frontend normalization)
    if (value.includes('-')) {
      const [year, month, day] = value.split('-').map(Number);
      if (year && month && day) {
        return new Date(year, month - 1, day);
      }
    }

    // Handle MM/DD/YYYY or MM/DD/YY
    let [month, day, year] = value.split('/').map((part) => Number(part));
    if (!month || !day || !year) {
      return null;
    }
    
    // Fix 2-digit years (e.g. 23 becomes 2023)
    if (year < 100) {
      year += 2000;
    }
    
    return new Date(year, month - 1, day);
  }

  private mapCsvRow(row: PsychiatryCsvRow): Partial<Outreach> {
    const {
      NPI,
      Name,
      'Enumeration Date': enumerationDate,
      Taxonomy,
      City,
      State,
      'Postal Code': postalCode,
      'Practice Phone': practicePhone,
      'Authorized First Name': authFirst,
      'Authorized Last Name': authLast,
      'Authorized Phone': authPhone,
      Disposition,
      Comment,
      Email,
      'Email Address': emailAddress,
      'email addresses': emailAddresses,
      'Email Addresses': emailAddresses2,
      ...additionalData
    } = row;

    const emailValue = (Email || emailAddress || emailAddresses || emailAddresses2 || '').trim() || null;

    return {
      npi: NPI?.trim() ?? '',
      name: Name?.trim() ?? '',
      enumerationDate: this.parseEnumerationDate(enumerationDate),
      taxonomy: Taxonomy?.trim() || null,
      city: City?.trim() || null,
      state: State?.trim() || null,
      postalCode: postalCode?.trim() || null,
      practicePhone: practicePhone?.trim() || null,
      authFirst: authFirst?.trim() || null,
      authLast: authLast?.trim() || null,
      authPhone: authPhone?.trim() || null,
      email: emailValue,
      disposition: Disposition?.trim() || null,
      csvComments: Comment?.trim() || null,
      comment: null,
      status: 'pending',
      additionalData,
    };
  }

  private parseCsvContent(content: string): Partial<Outreach>[] {
    const rows = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as PsychiatryCsvRow[];

    return rows
      .filter((row) => row.NPI?.trim() || row.Name?.trim())
      .map((row) => this.mapCsvRow(row));
  }

  async importFromFile(filename = 'Psychiatry.csv', organizationId?: number) {
    const filePath = path.join(process.cwd(), filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`CSV file not found: ${filename}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return this.importFromContent(content, organizationId);
  }

  async importFromContent(content: string, organizationId?: number, userId?: number, assignedToId?: number, fileName?: string) {
    const providerFile = this.providerFileRepository.create({
      fileName: fileName || 'Legacy Upload',
      organizationId,
      uploadedById: userId,
      assignedToId: assignedToId || userId,
    });
    const savedFile = await this.providerFileRepository.save(providerFile);

    const records = this.parseCsvContent(content).map((record) => ({
      ...record,
      organizationId,
      providerFileId: savedFile.id,
    }));
    const saved = await this.outreachRepository.save(records);
    return {
      message: 'Successfully imported records',
      count: saved.length,
      fileId: savedFile.id,
    };
  }

  private normalizeFilter(value?: string): string | undefined {
    if (!value?.trim()) {
      return undefined;
    }

    return decodeURIComponent(value.replace(/\+/g, ' '))
      .trim()
      .replace(/\s+/g, ' ');
  }

  private normalizeCompact(value: string): string {
    return value.toLowerCase().replace(/\s+/g, '');
  }

  private parseDateFilter(value?: string): string | undefined {
    const normalized = this.normalizeFilter(value);
    if (!normalized) {
      return undefined;
    }

    const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private buildFilteredQuery(
    organizationId: number,
    filters?: {
      providerFileId?: number;
      state?: string;
      taxonomy?: string;
      disposition?: string;
      startDate?: string;
      toDate?: string;
    },
  ) {
    const providerFileId = filters?.providerFileId;
    const state = this.normalizeFilter(filters?.state);
    const taxonomy = this.normalizeFilter(filters?.taxonomy);
    const disposition = this.normalizeFilter(filters?.disposition);
    const startDate = this.parseDateFilter(filters?.startDate);
    const toDate = this.parseDateFilter(filters?.toDate);

    const query = this.outreachRepository
      .createQueryBuilder('outreach')
      .where('outreach.organizationId = :organizationId', { organizationId });

    if (state) {
      const statesArray = state.split(',').map((s) => s.trim().toUpperCase());
      query.andWhere('UPPER(outreach.state) IN (:...statesArray)', {
        statesArray,
      });
    }

    if (providerFileId) {
      query.andWhere('outreach.providerFileId = :providerFileId', {
        providerFileId,
      });
    }

    if (taxonomy) {
      query.andWhere('outreach.taxonomy ILIKE :taxonomy', {
        taxonomy: `%${taxonomy}%`,
      });
    }

    if (disposition) {
      query.andWhere(
        "REPLACE(LOWER(COALESCE(outreach.disposition, '')), ' ', '') LIKE :disposition",
        { disposition: `%${this.normalizeCompact(disposition)}%` },
      );
    }

    if (startDate) {
      query.andWhere('outreach.enumerationDate >= CAST(:startDate AS DATE)', { startDate });
    }

    if (toDate) {
      query.andWhere('outreach.enumerationDate <= CAST(:toDate AS DATE)', { toDate });
    }

    return query;
  }

  async findAll(
    organizationId: number,
    filters?: {
      providerFileId?: number;
      state?: string;
      taxonomy?: string;
      disposition?: string;
      startDate?: string;
      toDate?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = Math.max(Number(filters?.page) || 1, 1);
    const limit = Math.min(Math.max(Number(filters?.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const query = this.buildFilteredQuery(organizationId, filters)
      .orderBy('outreach.id', 'ASC')
      .skip(skip)
      .take(limit);

    const [records, total] = await query.getManyAndCount();

    if (!records.length) {
      return {
        data: [],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0,
      };
    }

    const counts = await this.outreachCommentRepository
      .createQueryBuilder('comment')
      .select('comment.outreachId', 'outreachId')
      .addSelect('COUNT(comment.id)', 'count')
      .where('comment.outreachId IN (:...ids)', {
        ids: records.map((record) => record.id),
      })
      .groupBy('comment.outreachId')
      .getRawMany();

    const countMap = new Map(
      counts.map((item) => [Number(item.outreachId), Number(item.count)]),
    );

    const data = records.map((record) =>
      Object.assign(record, {
        commentsCount: countMap.get(record.id) ?? 0,
      }),
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  /** Returns ALL matching records without a pagination cap, intended for CSV export only. */
  async findAllForExport(
    organizationId: number,
    filters?: {
      providerFileId?: number;
      state?: string;
      taxonomy?: string;
      disposition?: string;
      startDate?: string;
      toDate?: string;
    },
  ) {
    const records = await this.buildFilteredQuery(organizationId, filters)
      .orderBy('outreach.id', 'ASC')
      .getMany();

    return { records, total: records.length };
  }

  private mapGraphRows(rows: Array<{ label: string | null; count: string }>) {
    return rows.map((row) => ({
      label: row.label?.trim() || 'Not Set',
      count: Number(row.count),
    }));
  }

  async getGraphData(
    organizationId: number,
    filters?: {
      providerFileId?: number;
      state?: string;
      taxonomy?: string;
      disposition?: string;
      startDate?: string;
      toDate?: string;
    },
  ) {
    const taxonomyQuery = this.buildFilteredQuery(organizationId, filters)
      .select('UPPER(outreach.taxonomy)', 'label')
      .addSelect('COUNT(*)', 'count')
      .groupBy('UPPER(outreach.taxonomy)')
      .orderBy('count', 'DESC');

    const stateQuery = this.buildFilteredQuery(organizationId, filters)
      .select('UPPER(outreach.state)', 'label')
      .addSelect('COUNT(*)', 'count')
      .groupBy('UPPER(outreach.state)')
      .orderBy('count', 'DESC');

    const dispositionQuery = this.buildFilteredQuery(organizationId, filters)
      .select('UPPER(outreach.disposition)', 'label')
      .addSelect('COUNT(*)', 'count')
      .groupBy('UPPER(outreach.disposition)')
      .orderBy('count', 'DESC');

    const totalQuery = this.buildFilteredQuery(organizationId, filters);

    const [taxonomies, states, dispositions, total] = await Promise.all([
      taxonomyQuery.getRawMany(),
      stateQuery.getRawMany(),
      dispositionQuery.getRawMany(),
      totalQuery.getCount(),
    ]);

    return {
      total,
      taxonomies: this.mapGraphRows(taxonomies),
      states: this.mapGraphRows(states),
      dispositions: this.mapGraphRows(dispositions),
    };
  }

  private async findOutreachOrFail(id: number, organizationId: number) {
    const record = await this.outreachRepository.findOne({
      where: { id, organizationId },
    });
    if (!record) {
      throw new NotFoundException(`Outreach record ${id} not found`);
    }
    return record;
  }

  async findComments(outreachId: number, organizationId: number) {
    await this.findOutreachOrFail(outreachId, organizationId);

    const comments = await this.outreachCommentRepository.find({
      where: { outreachId },
      relations: ['commentedBy'],
      order: { createdAt: 'DESC' },
    });

    return {
      outreachId,
      totalComments: comments.length,
      comments: comments.map((item) => ({
        id: item.id,
        comment: item.comment,
        createdAt: item.createdAt,
        commentedBy: {
          id: item.commentedBy.id,
          firstName: item.commentedBy.firstName,
          lastName: item.commentedBy.lastName,
          email: item.commentedBy.email,
          profilePic: item.commentedBy.profilePic,
        },
      })),
    };
  }

  async addComment(
    outreachId: number,
    organizationId: number,
    userId: number,
    createDto: CreateOutreachCommentDto,
  ) {
    await this.findOutreachOrFail(outreachId, organizationId);

    const user = await this.userRepository.findOne({
      where: { id: userId, organizationId },
    });
    if (!user) {
      throw new BadRequestException('User does not belong to this organization');
    }

    const saved = await this.outreachCommentRepository.save({
      outreachId,
      userId,
      comment: createDto.comment.trim(),
    });

    const comment = await this.outreachCommentRepository.findOne({
      where: { id: saved.id },
      relations: ['commentedBy'],
    });

    return {
      id: comment.id,
      comment: comment.comment,
      createdAt: comment.createdAt,
      commentedBy: {
        id: comment.commentedBy.id,
        firstName: comment.commentedBy.firstName,
        lastName: comment.commentedBy.lastName,
        email: comment.commentedBy.email,
        profilePic: comment.commentedBy.profilePic,
      },
    };
  }

  async findAllFiles(organizationId: number, userId?: number) {
    const query = this.providerFileRepository
      .createQueryBuilder('file')
      .leftJoinAndSelect('file.uploadedBy', 'uploadedBy')
      .leftJoinAndSelect('file.assignedTo', 'assignedTo')
      .where('file.organizationId = :organizationId', { organizationId });

    if (userId) {
      query.andWhere('(file.uploadedById = :userId OR file.assignedToId = :userId)', { userId });
    }

    return query.orderBy('file.createdAt', 'DESC').getMany();
  }

  async removeFile(id: number, organizationId: number) {
    const file = await this.providerFileRepository.findOne({
      where: { id, organizationId }
    });
    if (!file) {
      throw new NotFoundException(`File ${id} not found`);
    }
    // Using delete on Outreach directly to cascade if DB cascade is flaky, but typeorm cascade true on entity should handle it if we use remove.
    await this.outreachRepository.delete({ providerFileId: id });
    await this.providerFileRepository.delete(id);
    return { deleted: true };
  }

  async removeAllByOrganization(organizationId: number) {
    const result = await this.outreachRepository.delete({ organizationId });
    return { deleted: result.affected ?? 0 };
  }

  findOne(id: number) {
    return this.outreachRepository.findOne({ where: { id } });
  }

  async update(id: number, updateOutreachDto: UpdateOutreachDto) {
    const record = await this.findOne(id);
    if (!record) {
      throw new NotFoundException(`Outreach record ${id} not found`);
    }

    const updatePayload: Record<string, any> = { ...updateOutreachDto };
    if (
      updateOutreachDto.disposition !== undefined &&
      updateOutreachDto.disposition !== record.disposition
    ) {
      updatePayload.dispositionUpdatedAt = updateOutreachDto.dispositionUpdatedAt
        ? new Date(updateOutreachDto.dispositionUpdatedAt)
        : new Date();
    }

    await this.outreachRepository.update(id, updatePayload);
    return this.findOne(id);
  }

  async remove(id: number) {
    const record = await this.findOne(id);
    if (!record) {
      throw new NotFoundException(`Outreach record ${id} not found`);
    }
    await this.outreachRepository.delete(id);
    return { deleted: true };
  }
}
