import type pino from 'pino';

export type TransportTarget = {
  readonly target: string;
  readonly options?: Record<string, unknown>;
  readonly level?: pino.Level;
};

export type LoggerOptions = {
  readonly name: string;
  readonly level?: pino.Level;
  readonly transports?: ReadonlyArray<TransportTarget>;
  readonly options?: Omit<pino.LoggerOptions, 'name' | 'level' | 'transport'>;
};
