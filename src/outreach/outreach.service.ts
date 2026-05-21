import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';
import { UpdateOutreachDto } from './dto/update-outreach.dto';
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

  async importFromFile(filename = 'Psychiatry.csv') {
    const filePath = path.join(process.cwd(), filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`CSV file not found: ${filename}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return this.importFromContent(content);
  }

  async importFromContent(content: string) {
    const records = this.parseCsvContent(content);
    const saved = await this.outreachRepository.save(records);
    return {
      inserted: saved.length,
      records: saved,
    };
  }

  findAll() {
    return this.outreachRepository.find({ order: { id: 'ASC' } });
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
