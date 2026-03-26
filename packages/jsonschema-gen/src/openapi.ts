import { fixture as coreFixture, type FixtureGenerator, type FixtureOptions } from '@l4n3/gen-core';
import { toNode } from './adapter.js';
import type { JsonSchema } from './types.js';

type OpenAPISpec = {
  readonly components?: {
    readonly schemas?: Readonly<Record<string, JsonSchema>>;
  };
  readonly [key: string]: unknown;
};

type SchemaGenerators = Readonly<Record<string, FixtureGenerator<unknown>>>;

export const fromOpenAPI = (spec: OpenAPISpec, opts?: FixtureOptions): SchemaGenerators => {
  const schemas = spec.components?.schemas;
  if (!schemas) return {};

  return Object.fromEntries(
    Object.entries(schemas).map(([name, schema]) => {
      // Wrap each schema with the root spec's $defs so $ref resolution works
      const schemaWithDefs: JsonSchema = {
        ...schema,
        $defs: { ...schemas, ...schema.$defs },
      };
      return [name, coreFixture(toNode(schemaWithDefs), opts)];
    }),
  );
};
