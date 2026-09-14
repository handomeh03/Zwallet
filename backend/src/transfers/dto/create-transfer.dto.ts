import { IsIn, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateTransferDto {
  @IsIn(['INTERNAL_USER', 'EXTERNAL_IBAN'])
  recipientType!: 'INTERNAL_USER' | 'EXTERNAL_IBAN';

  @IsOptional()
  @IsString()
  recipientUserId?: string;

  @IsOptional()
  @IsString()
  recipientIban?: string;

  @IsNumber()
  @IsPositive()
  amount!: number;
}
