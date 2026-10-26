import { IsString, IsArray, ArrayMinSize } from "class-validator";

export class PreviewMergeDto {
  @IsString()
  customerId: string;

  @IsArray()
  @ArrayMinSize(1)
  sourcePropertyIds: string[];

  @IsString()
  targetPropertyId: string;
}
