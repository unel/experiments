import * as dotenv from 'dotenv';

dotenv.config({ debug: true });

export const ENV = { ...process.env };
