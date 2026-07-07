import { IsArray, IsOptional } from 'class-validator';

export class UpdateDiagramDto {
  @IsOptional()
  @IsArray()
  nodes?: unknown[];

  @IsOptional()
  @IsArray()
  edges?: unknown[];
}
