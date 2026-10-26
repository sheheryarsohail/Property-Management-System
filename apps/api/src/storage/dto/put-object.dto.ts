import { IsBase64, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class PutObjectDto {
  @IsBase64()
  @IsString()
  base64!: string;

  @IsString()
  @MaxLength(120)
  contentType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  keyHint?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  ttlDays?: number;
}
