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
  'Auth First': string;
  'Auth Last': string;
  'Auth Phone': string;
  Disposition: string;
  Comments: string;
};

@Injectable()
export class OutreachService {
  constructor(
    @InjectRepository(Outreach)
    private readonly outreachRepository: Repository<Outreach>,
    @InjectRepository(OutreachComment)
    private readonly outreachCommentRepository: Repository<OutreachComment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private parseEnumerationDate(value: string): Date | null {
    if (!value?.trim()) {
      return null;
    }
    const [month, day, year] = value.split('/').map((part) => Number(part));
    if (!month || !day || !year) {
      return null;
    }
    return new Date(year, month - 1, day);
  }

  private mapCsvRow(row: PsychiatryCsvRow): Partial<Outreach> {
    return {
      npi: row.NPI?.trim() ?? '',
      name: row.Name?.trim() ?? '',
      enumerationDate: this.parseEnumerationDate(row['Enumeration Date']),
      taxonomy: row.Taxonomy?.trim() || null,
      city: row.City?.trim() || null,
      state: row.State?.trim() || null,
      postalCode: row['Postal Code']?.trim() || null,
      practicePhone: row['Practice Phone']?.trim() || null,
      authFirst: row['Auth First']?.trim() || null,
      authLast: row['Auth Last']?.trim() || null,
      authPhone: row['Auth Phone']?.trim() || null,
      disposition: row.Disposition?.trim() || null,
      csvComments: row.Comments?.trim() || null,
      comment: null,
      status: 'pending',
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

  async importFromContent(content: string, organizationId?: number) {
    const records = this.parseCsvContent(content).map((record) => ({
      ...record,
      organizationId,
    }));
    const saved = await this.outreachRepository.save(records);
    return {
      inserted: saved.length,
      records: saved,
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
      state?: string;
      taxonomy?: string;
      disposition?: string;
      startDate?: string;
      toDate?: string;
    },
  ) {
    const state = this.normalizeFilter(filters?.state);
    const taxonomy = this.normalizeFilter(filters?.taxonomy);
    const disposition = this.normalizeFilter(filters?.disposition);
    const startDate = this.parseDateFilter(filters?.startDate);
    const toDate = this.parseDateFilter(filters?.toDate);

    const query = this.outreachRepository
      .createQueryBuilder('outreach')
      .where('outreach.organizationId = :organizationId', { organizationId });

    if (state) {
      query.andWhere('UPPER(outreach.state) = :state', {
        state: state.toUpperCase(),
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
      query.andWhere('outreach.enumerationDate >= :startDate', { startDate });
    }

    if (toDate) {
      query.andWhere('outreach.enumerationDate <= :toDate', { toDate });
    }

    return query;
  }

  async findAll(
    organizationId: number,
    filters?: {
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

  private applyGraphDateFilters(
    query: ReturnType<Repository<Outreach>['createQueryBuilder']>,
    startDate?: string,
    toDate?: string,
  ) {
    if (startDate) {
      query.andWhere('outreach.enumerationDate >= :startDate', { startDate });
    }
    if (toDate) {
      query.andWhere('outreach.enumerationDate <= :toDate', { toDate });
    }
    return query;
  }

  private mapGraphRows(rows: Array<{ label: string | null; count: string }>) {
    return rows.map((row) => ({
      label: row.label?.trim() || 'Not Set',
      count: Number(row.count),
    }));
  }

  async getGraphData(
    organizationId: number,
    filters?: { startDate?: string; toDate?: string },
  ) {
    const startDate = this.parseDateFilter(filters?.startDate);
    const toDate = this.parseDateFilter(filters?.toDate);

    const taxonomyQuery = this.outreachRepository
      .createQueryBuilder('outreach')
      .select('outreach.taxonomy', 'label')
      .addSelect('COUNT(*)', 'count')
      .where('outreach.organizationId = :organizationId', { organizationId });
    this.applyGraphDateFilters(taxonomyQuery, startDate, toDate);

    const stateQuery = this.outreachRepository
      .createQueryBuilder('outreach')
      .select('outreach.state', 'label')
      .addSelect('COUNT(*)', 'count')
      .where('outreach.organizationId = :organizationId', { organizationId });
    this.applyGraphDateFilters(stateQuery, startDate, toDate);

    const dispositionQuery = this.outreachRepository
      .createQueryBuilder('outreach')
      .select('outreach.disposition', 'label')
      .addSelect('COUNT(*)', 'count')
      .where('outreach.organizationId = :organizationId', { organizationId });
    this.applyGraphDateFilters(dispositionQuery, startDate, toDate);

    const totalQuery = this.outreachRepository
      .createQueryBuilder('outreach')
      .where('outreach.organizationId = :organizationId', { organizationId });
    this.applyGraphDateFilters(totalQuery, startDate, toDate);

    const [taxonomies, states, dispositions, total] = await Promise.all([
      taxonomyQuery
        .groupBy('outreach.taxonomy')
        .orderBy('count', 'DESC')
        .getRawMany(),
      stateQuery.groupBy('outreach.state').orderBy('count', 'DESC').getRawMany(),
      dispositionQuery
        .groupBy('outreach.disposition')
        .orderBy('count', 'DESC')
        .getRawMany(),
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
    await this.outreachRepository.update(id, updateOutreachDto);
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
