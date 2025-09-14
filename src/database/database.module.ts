import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { getDatabaseConfig } from './database.provider';

const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async (): Promise<DataSource> => {
      const dataSource = new DataSource(getDatabaseConfig() as any);
      return dataSource.initialize();
    },
  },
];

@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {}
