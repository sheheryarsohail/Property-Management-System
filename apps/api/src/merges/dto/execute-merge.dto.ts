import { IsString, IsArray, ArrayMinSize, IsOptional } from "class-validator";

export class ExecuteMergeDto {
  @IsString()
  customerId: string;

  @IsArray()
  @ArrayMinSize(1)
  sourcePropertyIds: string[];

  @IsString()
  targetPropertyId: string;

  @IsOptional()
  @IsString()
  receiptCode?: string;

  @IsOptional()
  @IsString()
  receiptDate?: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
