import type { DataSource } from 'typeorm';
import { BaseRepository } from '../../../core/repositories/base.repository.ts';
import { WidgetSettings } from '../entities/widget-settings.entity.ts';

export class WidgetSettingsRepository extends BaseRepository<WidgetSettings> {
  constructor(dataSource: DataSource) {
    super(dataSource, WidgetSettings);
  }
}
