import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard';
import { currentUser } from 'src/decorators/currentuser';
import { CompanyPoliciesService } from './company-policies.service';
import { CreateCompanyPolicyDto } from './dto/create-company-policy.dto';
import { UpdateCompanyPolicyDto } from './dto/update-company-policy.dto';

@ApiTags('company-policies')
@Controller('company-policies')
export class CompanyPoliciesController {
  constructor(
    private readonly companyPoliciesService: CompanyPoliciesService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  create(
    @Body() createDto: CreateCompanyPolicyDto,
    @currentUser() user: { organization: number },
  ) {
    return this.companyPoliciesService.create({
      ...createDto,
      organizationId: user.organization,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  findAll(@currentUser() user: { organization: number; userId: number }) {
    return this.companyPoliciesService.findAll(
      user.organization,
      user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/acknowledgements')
  getAcknowledgementStatus(
    @Param('id') id: string,
    @currentUser() user: { organization: number },
  ) {
    return this.companyPoliciesService.getAcknowledgementStatus(
      +id,
      user.organization,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/acknowledge')
  acknowledge(
    @Param('id') id: string,
    @currentUser() user: { organization: number; userId: number },
  ) {
    return this.companyPoliciesService.acknowledge(
      +id,
      user.userId,
      user.organization,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @currentUser() user: { organization: number; userId: number },
  ) {
    return this.companyPoliciesService.findOne(
      +id,
      user.organization,
      user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCompanyPolicyDto,
    @currentUser() user: { organization: number },
  ) {
    return this.companyPoliciesService.update(+id, user.organization, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @currentUser() user: { organization: number },
  ) {
    return this.companyPoliciesService.remove(+id, user.organization);
  }
}
