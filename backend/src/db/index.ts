import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://ecom:ecom_dev_password@localhost:5432/ecom_platform';

// For query purposes
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

// For migrations
export const migrationClient = postgres(connectionString, { max: 1 });
