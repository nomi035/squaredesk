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

  findAll(
    organizationId: number,
    filters?: { state?: string; taxonomy?: string; disposition?: string },
  ) {
    const query = this.outreachRepository
      .createQueryBuilder('outreach')
      .where('outreach.organizationId = :organizationId', { organizationId });

    if (filters?.state) {
      query.andWhere('outreach.state ILIKE :state', {
        state: filters.state.trim(),
      });
    }

    if (filters?.taxonomy) {
      query.andWhere('outreach.taxonomy ILIKE :taxonomy', {
        taxonomy: `%${filters.taxonomy.trim()}%`,
      });
    }

    if (filters?.disposition) {
      query.andWhere('outreach.disposition ILIKE :disposition', {
        disposition: `%${filters.disposition.trim()}%`,
      });
    }

    return query
      .loadRelationCountAndMap('outreach.commentsCount', 'outreach.comments')
      .orderBy('outreach.id', 'ASC')
      .getMany();
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
