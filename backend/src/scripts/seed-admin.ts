import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { AuthService } from '../auth/auth.service';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

const logger = new Logger('SeedAdmin');

/**
 * Idempotent bootstrap: ensures exactly one ADMIN user exists and that the
 * app's fixed settlement IBAN is linked to them. Safe to re-run.
 *
 * Reuses AuthService.signup and BankAccountsService.link so the admin goes
 * through the exact same signup/link path (and the same real Accounts API
 * call) as any customer would.
 */
async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const config = app.get(ConfigService);
  const prisma = app.get(PrismaService);
  const authService = app.get(AuthService);
  const bankAccountsService = app.get(BankAccountsService);

  const adminEmail = config.get<string>('admin.email')!;
  const adminPassword = config.get<string>('admin.password')!;
  const settlementIban = config.get<string>('admin.settlementIban')!;

  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!admin) {
    logger.log(`Creating admin user ${adminEmail}`);
    await authService.signup({ email: adminEmail, password: adminPassword, fullName: 'ZWallet Settlement' });
    admin = await prisma.user.findUniqueOrThrow({ where: { email: adminEmail } });
  }

  if (admin.role !== UserRole.ADMIN) {
    logger.log(`Promoting ${adminEmail} to ADMIN`);
    admin = await prisma.user.update({ where: { id: admin.id }, data: { role: UserRole.ADMIN } });
  }

  const existingLink = await prisma.linkedBankAccount.findUnique({ where: { iban: settlementIban } });

  if (!existingLink) {
    logger.log(`Linking settlement IBAN ${settlementIban} to admin`);
    await bankAccountsService.link(admin.id, { accountAddress: settlementIban });
  } else if (existingLink.userId !== admin.id) {
    logger.log(`Reassigning settlement IBAN ${settlementIban} from another user to admin`);
    await prisma.linkedBankAccount.update({
      where: { id: existingLink.id },
      data: { userId: admin.id, isPrimary: true },
    });
  } else {
    logger.log('Settlement account already correctly configured — nothing to do');
  }

  await app.close();
}

run()
  .then(() => {
    logger.log('Done');
    process.exit(0);
  })
  .catch((error) => {
    logger.error(error);
    process.exit(1);
  });
