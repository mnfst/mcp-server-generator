export interface Datasource {
  id: string;
  name: string;
  type: 'mysql';
  host: string;
  port: number;
  database: string;
  username: string;
  status: 'connected' | 'disconnected' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

export type DatasourceStatus = 'connected' | 'disconnected' | 'error';
