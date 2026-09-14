import { IsNumber, IsPositive, IsString } from 'class-validator';

export class TopupDto {
  @IsString()
  linkedBankAccountId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;
}
