import { fixture as coreFixture, type FixtureGenerator, type FixtureOptions } from '@l4n3/fakeish-gen-core';
import { toNode } from './adapter.js';
import type { JsonSchema } from './types.js';

export const fixture = <T = unknown>(schema: JsonSchema, opts?: FixtureOptions): FixtureGenerator<T> =>
  coreFixture<T>(toNode(schema), opts);
