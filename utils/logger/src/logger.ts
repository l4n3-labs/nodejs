import pino from 'pino';
import { resolveTransport } from './transports.js';
import type { LoggerOptions } from './types.js';

export const createLogger = ({ name, level = 'info', transports, options = {} }: LoggerOptions): pino.Logger =>
  pino({
    ...options,
    name,
    level,
    transport: resolveTransport(transports),
  });

export const createChildLogger = <Bindings extends pino.Bindings>(
  parent: pino.Logger,
  bindings: Bindings,
): pino.Logger => parent.child(bindings);
