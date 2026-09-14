import { IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateRefundRequestDto {
  @IsString()
  targetIdentifier!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @MinLength(5)
  reason!: string;

  @IsOptional()
  @IsString()
  originalTransactionId?: string;
}
