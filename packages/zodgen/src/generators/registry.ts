import type { Generator } from '../types.js';
import { generateArray } from './array.js';
import { generateBigInt } from './bigint.js';
import { generateBoolean } from './boolean.js';
import { generateDate } from './date.js';
import { generateEnum } from './enum.js';
import { generateIntersection } from './intersection.js';
import { generateLiteral } from './literal.js';
import { generateMap } from './map.js';
import { generateCatch, generateDefault, generateNullable, generateOptional, generateReadonly } from './nullable.js';
import { generateNumber } from './number.js';
import { generateObject } from './object.js';
import {
  generateAny,
  generateCustom,
  generateNaN,
  generateNever,
  generateNull,
  generateSymbol,
  generateUndefined,
  generateUnknown,
  generateVoid,
} from './primitives.js';
import { generateRecord } from './record.js';
import { generateLazy, generatePipe, generatePromise } from './recursive.js';
import { generateSet } from './set.js';
import { generateString } from './string.js';
import { generateTemplateLiteral } from './template-literal.js';
import { generateTuple } from './tuple.js';
import { generateUnion } from './union.js';

export const generators: ReadonlyMap<string, Generator> = new Map([
  ['string', generateString],
  ['number', generateNumber],
  ['boolean', generateBoolean],
  ['date', generateDate],
  ['bigint', generateBigInt],
  ['symbol', generateSymbol],
  ['object', generateObject],
  ['array', generateArray],
  ['tuple', generateTuple],
  ['set', generateSet],
  ['map', generateMap],
  ['record', generateRecord],
  ['literal', generateLiteral],
  ['enum', generateEnum],
  ['union', generateUnion],
  ['intersection', generateIntersection],
  ['nullable', generateNullable],
  ['optional', generateOptional],
  ['default', generateDefault],
  ['readonly', generateReadonly],
  ['catch', generateCatch],
  ['lazy', generateLazy],
  ['promise', generatePromise],
  ['pipe', generatePipe],
  ['null', generateNull],
  ['undefined', generateUndefined],
  ['void', generateVoid],
  ['never', generateNever],
  ['unknown', generateUnknown],
  ['any', generateAny],
  ['nan', generateNaN],
  ['custom', generateCustom],
  ['template_literal', generateTemplateLiteral],
]);
