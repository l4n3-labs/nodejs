import type pino from 'pino';
import type { TransportTarget } from './types.js';

const isProduction = () => process.env.NODE_ENV === 'production';

const defaultDevTransport: TransportTarget = {
  target: 'pino-pretty',
  options: { colorize: true },
};

export const resolveTransport = (
  transports: ReadonlyArray<TransportTarget> | undefined,
): pino.TransportMultiOptions | undefined => {
  if (transports !== undefined && transports.length > 0) {
    return { targets: [...transports] };
  }

  if (isProduction()) {
    return undefined;
  }

  return { targets: [defaultDevTransport] };
};
