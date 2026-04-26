import path from 'node:path';

export const PORT = Number(process.env.PORT || process.env.SERVER_PORT || 3000);
export const DATA_DIR = path.resolve('data');
export const DB_PATH = path.join(DATA_DIR, 'app.db');

export const JWT_SECRET = process.env.JWT_SECRET || 'change-this-to-a-long-random-secret';
export const SPECIAL_ACCESS_CODE = process.env.SPECIAL_ACCESS_CODE || 'CHAMBER-2026';
export const INVITE_CODES = (process.env.INVITE_CODES || 'CENTUM,CHAMBER,INVITE100')
  .split(',')
  .map((code) => code.trim().toUpperCase())
  .filter(Boolean);

export const DEVELOPER_ACCOUNT = {
  name: process.env.DEVELOPER_NAME || 'Zol Vo',
  username: process.env.DEVELOPER_USERNAME || 'Zol_Vo',
  password: process.env.DEVELOPER_PASSWORD || 'ZV_dev_2026',
  role: 'founder',
};

export const DEFAULT_ROOMS = [
  { id: 'plaza', name: 'Площадь', description: 'Главный хаб для всех' },
  { id: 'tech', name: 'Мастерская', description: 'Технологии и код' },
  { id: 'art', name: 'Галерея', description: 'Дизайн и искусство' },
  { id: 'offtopic', name: 'Курилка', description: 'Разговоры ни о чем' },
];
