import { IsIn, IsString, MinLength } from 'class-validator';

export class ResolveRecipientDto {
  @IsIn(['INTERNAL', 'EXTERNAL'])
  type!: 'INTERNAL' | 'EXTERNAL';

  @IsString()
  @MinLength(1)
  identifierOrIban!: string;
}
