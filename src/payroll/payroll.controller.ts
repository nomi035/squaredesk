import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard';
import { currentUser } from 'src/decorators/currentuser';
import { PayrollService } from './payroll.service';

@ApiTags('payroll')
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('generate/user/:userId')
  @ApiQuery({ name: 'month', required: false, description: 'YYYY-MM (defaults to current month)' })
  generateForUser(
    @Param('userId') userId: string,
    @currentUser() user: { organization: number },
    @Query('month') month?: string,
  ) {
    const monthKey = month ?? this.payrollService.getCurrentMonthKey();
    return this.payrollService.calculatePayrollForUser(
      +userId,
      user.organization,
      monthKey,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('generate/bulk')
  @ApiQuery({ name: 'month', required: false, description: 'YYYY-MM (defaults to current month)' })
  generateBulk(
    @currentUser() user: { organization: number },
    @Query('month') month?: string,
  ) {
    const monthKey = month ?? this.payrollService.getCurrentMonthKey();
    return this.payrollService.generateBulk(user.organization, monthKey);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiQuery({ name: 'month', required: false, description: 'YYYY-MM filter' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  findAll(
    @currentUser() user: { organization: number },
    @Query('month') month?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const targetMonth = month ?? this.payrollService.getCurrentMonthKey();
    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 25;
    return this.payrollService.findAll(user.organization, targetMonth, pageNum, limitNum);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('user/:userId')
  findByUser(
    @Param('userId') userId: string,
    @currentUser() user: { organization: number },
  ) {
    return this.payrollService.findByUser(+userId, user.organization);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  findOne(@Param('id') id: string, @currentUser() user: { organization: number }) {
    return this.payrollService.findOne(+id, user.organization);
  }
}
