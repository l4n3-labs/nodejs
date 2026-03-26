/**
 * Subset of JSON Schema Draft 2020-12 that we support for fixture generation.
 */
export type JsonSchema = {
  readonly type?: string | ReadonlyArray<string>;
  readonly properties?: Readonly<Record<string, JsonSchema>>;
  readonly required?: ReadonlyArray<string>;
  readonly additionalProperties?: boolean | JsonSchema;
  readonly items?: JsonSchema;
  readonly prefixItems?: ReadonlyArray<JsonSchema>;
  readonly minItems?: number;
  readonly maxItems?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly format?: string;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly exclusiveMinimum?: number | boolean;
  readonly exclusiveMaximum?: number | boolean;
  readonly multipleOf?: number;
  readonly enum?: ReadonlyArray<unknown>;
  readonly const?: unknown;
  readonly oneOf?: ReadonlyArray<JsonSchema>;
  readonly anyOf?: ReadonlyArray<JsonSchema>;
  readonly allOf?: ReadonlyArray<JsonSchema>;
  readonly $ref?: string;
  readonly $defs?: Readonly<Record<string, JsonSchema>>;
  readonly definitions?: Readonly<Record<string, JsonSchema>>;
  readonly default?: unknown;
  readonly nullable?: boolean;
};
