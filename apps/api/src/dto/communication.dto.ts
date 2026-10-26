import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CommChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PHONE = 'PHONE',
  WHATSAPP = 'WHATSAPP',
  NOTE = 'NOTE',
}

export class CreateCommunicationDto {
  @ApiProperty({ enum: CommChannel, description: 'Communication channel' })
  @IsEnum(CommChannel)
  channel: CommChannel;

  @ApiPropertyOptional({ description: 'Customer ID' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Property ID' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ description: 'Invoice ID' })
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'Subject/Title' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ description: 'Message body' })
  @IsString()
  body: string;
}

export class SendReminderDto {
  @ApiPropertyOptional({ description: 'Customer IDs to send reminders to' })
  @IsOptional()
  customerId?: string[];

  @ApiPropertyOptional({ description: 'Property IDs to filter by' })
  @IsOptional()
  propertyId?: string[];

  @ApiPropertyOptional({ description: 'Reminder type', enum: ['DUE_INVOICE', 'OVERDUE_INVOICE', 'PDC_DEPOSIT'] })
  @IsOptional()
  @IsEnum(['DUE_INVOICE', 'OVERDUE_INVOICE', 'PDC_DEPOSIT'])
  reminderType?: string;

  @ApiProperty({ enum: CommChannel, description: 'Communication channel' })
  @IsEnum(CommChannel)
  channel: CommChannel;
}
