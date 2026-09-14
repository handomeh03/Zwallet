import { IsOptional, IsString, MinLength } from 'class-validator';

export class LinkAccountDto {
  @IsString()
  @MinLength(1)
  accountAddress!: string;

  @IsOptional()
  @IsString()
  label?: string;
}
