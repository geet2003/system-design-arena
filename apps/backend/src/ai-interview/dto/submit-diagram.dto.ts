import { IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FreeNodeDto {
  @IsString()
  id!: string;

  @IsString()
  label!: string;
}

export class FreeEdgeDto {
  @IsString()
  source!: string;

  @IsString()
  target!: string;
}

export class SubmitDiagramDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FreeNodeDto)
  nodes!: FreeNodeDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FreeEdgeDto)
  edges!: FreeEdgeDto[];
}
