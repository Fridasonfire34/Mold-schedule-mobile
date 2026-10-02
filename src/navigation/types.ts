import { Operator } from '../api/auth';

export type RootStackParamList = {
  Login: undefined;
  // Administrators: pick the process.
  Home: { operator: Operator };
  Cleaning: { operator: Operator };
  Accept: { operator: Operator };
  Repairs: { operator: Operator };
};

// The screen each process opens after signing in.
export const PROCESS_SCREEN = {
  ADMIN: 'Home',
  CLEANING: 'Cleaning',
  ACCEPT: 'Accept',
  REPAIRS: 'Repairs',
  REORDERS: 'Repairs',
} as const;
