import type { Faker } from '@faker-js/faker';
import type { RegexNode } from './ast.js';
import { expandCharClass, printableAsciiCodes } from './char-class.js';
import { parse } from './parser.js';
import { tokenize } from './tokenizer.js';

export type GenerateOptions = {
  readonly minLength?: number;
  readonly maxLength?: number;
};

/**
 * Generate a random string matching the given regex pattern.
 * Uses Faker for random number generation to inherit seeding from the fixture pipeline.
 */
export const generateFromPattern = (pattern: string, faker: Faker): string => {
  const tokens = tokenize(pattern);
  const ast = parse(tokens);
  return generateFromAst(ast, faker);
};

/**
 * Generate a random string from a pre-parsed regex AST.
 */
export const generateFromAst = (ast: RegexNode, faker: Faker): string => {
  // Capture map for backreferences: group index -> generated string
  const captures = new Map<number, string>();

  const generate = (node: RegexNode): string => {
    switch (node.type) {
      case 'literal':
        return node.char;

      case 'dot': {
        const codes = printableAsciiCodes();
        const idx = faker.number.int({ min: 0, max: codes.length - 1 });
        return String.fromCodePoint(codes[idx]);
      }

      case 'charClass': {
        const codes = expandCharClass(node.ranges, node.negated);
        if (codes.length === 0) return '';
        const idx = faker.number.int({ min: 0, max: codes.length - 1 });
        return String.fromCodePoint(codes[idx]);
      }

      case 'sequence':
        return node.elements.map(generate).join('');

      case 'alternation': {
        const idx = faker.number.int({ min: 0, max: node.alternatives.length - 1 });
        return generate(node.alternatives[idx]);
      }

      case 'quantifier': {
        const count = faker.number.int({ min: node.min, max: node.max });
        return Array.from({ length: count }, () => generate(node.body)).join('');
      }

      case 'group': {
        const result = generate(node.body);
        if (node.capturing && node.index !== null) {
          captures.set(node.index, result);
        }
        return result;
      }

      case 'anchor':
        return ''; // Anchors don't produce characters

      case 'backreference':
        return captures.get(node.index) ?? '';
    }
  };

  return generate(ast);
};
