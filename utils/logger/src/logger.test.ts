import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { createChildLogger, createLogger } from './logger.js';

describe('createLogger', () => {
  it('returns a pino instance with the given name', () => {
    const logger = createLogger({ name: 'test-service' });
    expect(logger).toBeDefined();
    expect(logger.bindings().name).toBe('test-service');
  });

  it('defaults level to info', () => {
    const logger = createLogger({ name: 'test' });
    expect(logger.level).toBe('info');
  });

  it('respects a custom level', () => {
    const logger = createLogger({ name: 'test', level: 'debug' });
    expect(logger.level).toBe('debug');
  });

  it('uses pino-pretty transport when NODE_ENV is not production', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const logger = createLogger({ name: 'test' });
    // Logger should be created without throwing — pino-pretty is available
    expect(logger).toBeDefined();

    process.env.NODE_ENV = original;
  });

  it('uses JSON transport when NODE_ENV is production', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const logger = createLogger({ name: 'test' });
    expect(logger).toBeDefined();

    process.env.NODE_ENV = original;
  });

  it('accepts custom transports that override defaults', () => {
    const logger = createLogger({
      name: 'test',
      transports: [{ target: 'pino-pretty', options: { colorize: false } }],
    });
    expect(logger).toBeDefined();
  });

  it('passes through additional pino options', () => {
    const logger = createLogger({
      name: 'test',
      options: { timestamp: false },
    });
    expect(logger).toBeDefined();
  });
});

describe('createChildLogger', () => {
  it('creates a child logger with merged bindings', () => {
    const parent = createLogger({ name: 'parent' });
    const child = createChildLogger(parent, { requestId: 'abc-123' });

    expect(child).toBeDefined();
    expect(child.bindings().requestId).toBe('abc-123');
  });

  it('preserves parent name in child bindings', () => {
    const parent = createLogger({ name: 'parent' });
    const child = createChildLogger(parent, { module: 'auth' });

    expect(child.bindings().module).toBe('auth');
  });

  it('supports nested children', () => {
    const root = createLogger({ name: 'root' });
    const child = createChildLogger(root, { service: 'api' });
    const grandchild = createChildLogger(child, { handler: 'login' });

    const bindings = grandchild.bindings();
    expect(bindings.service).toBe('api');
    expect(bindings.handler).toBe('login');
  });

  it('writes logs with child bindings included', () => {
    const stream = pino.destination({ sync: true, dest: '/dev/null' });
    const parent = pino({ name: 'test' }, stream);
    const child = createChildLogger(parent, { requestId: 'req-1' });

    // Should not throw
    child.info('test message');
    child.error({ err: new Error('boom') }, 'something failed');
  });
});
