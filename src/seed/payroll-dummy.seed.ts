import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Break } from '../break/entities/break.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Role, User } from '../user/entities/user.entity';

config();

const SEED_PASSWORD = 'password123';
/** Prefer your real org; override with SEED_ORGANIZATION_ID=1 */
const PREFERRED_ORG_NAME = 'medaxis';

const seedUsers = [
  {
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice.payroll@test.com',
    salaryAmount: 5000,
    role: Role.EMPLOYEE,
    /** weekdays to seed with full 9h days */
    fullDays: 12,
  },
  {
    firstName: 'Bob',
    lastName: 'Smith',
    email: 'bob.payroll@test.com',
    salaryAmount: 6500,
    role: Role.EMPLOYEE,
    fullDays: 10,
  },
  {
    firstName: 'Carol',
    lastName: 'Davis',
    email: 'carol.payroll@test.com',
    salaryAmount: 4200,
    role: Role.EMPLOYEE,
    /** partial hours: 6h per day */
    fullDays: 8,
    hoursPerDay: 6,
  },
  {
    firstName: 'Payroll',
    lastName: 'Admin',
    email: 'admin.payroll@test.com',
    salaryAmount: 8000,
    role: Role.ADMIN,
    fullDays: 5,
  },
];

function getWeekdaysInCurrentMonth(untilToday = true): Date[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = untilToday ? now.getDate() : new Date(year, month + 1, 0).getDate();
  const weekdays: Date[] = [];

  for (let day = 1; day <= lastDay; day += 1) {
    const date = new Date(year, month, day);
    const dow = date.getDay();
    if (dow >= 1 && dow <= 5) {
      weekdays.push(date);
    }
  }

  return weekdays;
}

async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.database_url,
    port: Number(process.env.DB_PORT) || 5432,
    entities: [Organization, User, Attendance, Break],
    synchronize: false,
  });

  await dataSource.initialize();
  const orgRepo = dataSource.getRepository(Organization);
  const userRepo = dataSource.getRepository(User);
  const attendanceRepo = dataSource.getRepository(Attendance);

  const orgIdFromEnv = process.env.SEED_ORGANIZATION_ID
    ? Number(process.env.SEED_ORGANIZATION_ID)
    : undefined;

  let organization = orgIdFromEnv
    ? await orgRepo.findOne({ where: { id: orgIdFromEnv } })
    : await orgRepo.findOne({ where: { name: PREFERRED_ORG_NAME } });

  if (!organization) {
    const [firstOrg] = await orgRepo.find({ order: { id: 'ASC' }, take: 1 });
    organization = firstOrg;
  }

  if (!organization) {
    throw new Error(
      'No organization found. Create one first or set SEED_ORGANIZATION_ID.',
    );
  }

  console.log(
    `Using organization id=${organization.id} (${organization.name})`,
  );

  const seedEmails = seedUsers.map((u) => u.email);
  const existingSeedUsers = await userRepo
    .createQueryBuilder('user')
    .where('user.email IN (:...seedEmails)', { seedEmails })
    .getMany();

  if (existingSeedUsers.length) {
    const ids = existingSeedUsers.map((u) => u.id);
    await attendanceRepo
      .createQueryBuilder()
      .delete()
      .where('employeeId IN (:...ids)', { ids })
      .execute();
    await userRepo.delete(ids);
    console.log(`Removed ${existingSeedUsers.length} previous seed users and their attendances`);
  }

  const weekdays = getWeekdaysInCurrentMonth(true);
  const monthLabel = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  for (const seed of seedUsers) {
    const user = await userRepo.save({
      firstName: seed.firstName,
      lastName: seed.lastName,
      email: seed.email,
      password: SEED_PASSWORD,
      phone: '555-0100',
      role: seed.role,
      organizationId: organization.id,
      salaryAmount: seed.salaryAmount,
      isActive: true,
    });

    const daysToSeed = weekdays.slice(0, seed.fullDays);
    const hoursPerDay = seed.hoursPerDay ?? 9;
    const durationMinutes = hoursPerDay * 60;

    for (const day of daysToSeed) {
      const checkinDate = new Date(day);
      checkinDate.setHours(0, 0, 0, 0);
      await attendanceRepo.save({
        employeeId: user.id,
        checkinDate,
        checkinTime: '09:00:00 AM',
        checkoutDate: checkinDate,
        checkoutTime: hoursPerDay === 9 ? '06:00:00 PM' : '03:00:00 PM',
        duration: durationMinutes,
        isActive: true,
      });
    }

    console.log(
      `User ${user.email} (id=${user.id}) — salary $${seed.salaryAmount}, ${daysToSeed.length} attendance days (${hoursPerDay}h/day)`,
    );
  }

  await dataSource.destroy();

  console.log('\n--- Payroll seed complete ---');
  console.log(`Organization id: ${organization.id}`);
  console.log(`Month: ${monthLabel}`);
  console.log(`Login (admin): admin.payroll@test.com / ${SEED_PASSWORD}`);
  console.log('Employees: alice.payroll@test.com, bob.payroll@test.com, carol.payroll@test.com');
  console.log(`\nTest bulk payroll: POST /payroll/generate/bulk (JWT org=${organization.id})`);
}

runSeed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
