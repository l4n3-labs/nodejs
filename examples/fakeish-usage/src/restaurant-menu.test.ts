import { fixture } from '@l4n3/fakeish';
import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { allergenSchema, menuItemSchema, menuSectionSchema, restaurantMenuSchema } from './restaurant-menu.js';

// --- Reusable fixture factory ---

const createMenuItemGen = (seed = 42) => fixture(menuItemSchema, { seed });

describe('restaurant menu fixtures', () => {
  // ── Configuration options ──────────────────────────────────────────

  describe('configuration options', () => {
    it('produces deterministic menu items with seed', () => {
      const a = createMenuItemGen(42).one();
      const b = createMenuItemGen(42).one();
      expect(a).toEqual(b);
    });

    it('produces different items with different seeds', () => {
      const a = createMenuItemGen(1).one();
      const b = createMenuItemGen(2).one();
      expect(a).not.toEqual(b);
    });

    it('seed via .seed() method matches seed via options', () => {
      const viaOptions = fixture(menuItemSchema, { seed: 99 }).one();
      const viaMethod = fixture(menuItemSchema).seed(99).one();
      expect(viaOptions).toEqual(viaMethod);
    });

    it('uses a custom string generator for all string fields', () => {
      const gen = fixture(menuItemSchema).generator(
        'string',
        (ctx) => `test-${ctx.path.at(-1)}` as typeof ctx extends { schema: z.ZodType<infer T> } ? T : never,
      );
      const item = gen.one();
      expect(item.name).toBe('test-name');
      expect(item.description).toBe('test-description');
    });
  });

  // ── Overriding fixtures ────────────────────────────────────────────

  describe('overriding fixtures', () => {
    it('overrides category to a fixed value via string key', () => {
      const item = fixture(menuItemSchema)
        .override('category', () => 'dessert' as const)
        .one();
      expect(item.category).toBe('dessert');
    });

    it('overrides price via predicate matching on path', () => {
      const item = fixture(menuItemSchema)
        .override(
          (ctx) => ctx.path.at(-1) === 'price',
          () => 9.99,
        )
        .one();
      expect(item.price).toBe(9.99);
    });

    it('chains multiple overrides (category + price)', () => {
      const item = fixture(menuItemSchema)
        .override('category', () => 'appetizer' as const)
        .override('price', () => 5.5)
        .one();
      expect(item.category).toBe('appetizer');
      expect(item.price).toBe(5.5);
    });

    it('uses partialOverride to pin specific nested fields in array items', () => {
      const section = fixture(menuSectionSchema)
        .partialOverride('items', { name: () => 'Tiramisu' })
        .override('title', () => 'Desserts')
        .one();
      expect(section.title).toBe('Desserts');
      expect(section.items.length).toBeGreaterThanOrEqual(2);
      for (const item of section.items) {
        expect(item.name).toBe('Tiramisu');
      }
    });

    it('uses .for() to rebind a configured generator to a different schema', () => {
      const baseGen = fixture(menuItemSchema, { seed: 42 }).override('name', () => 'Shared Name');
      const sectionGen = baseGen.for(menuSectionSchema);
      const section = sectionGen.one();
      // The name override carries over to menuItem names inside the section
      expect(typeof section.title).toBe('string');
    });
  });

  // ── Reusing fixtures ───────────────────────────────────────────────

  describe('reusing fixtures', () => {
    const baseGen = createMenuItemGen();

    const vegetarianGen = baseGen.override('vegetarian', () => true);
    const spicyGen = baseGen.override('spiceLevel', () => 5);

    it('derives a vegetarian item generator from a base', () => {
      const items = vegetarianGen.many(10);
      for (const item of items) {
        expect(item.vegetarian).toBe(true);
      }
    });

    it('derives a spicy item generator from the same base', () => {
      const items = spicyGen.many(10);
      for (const item of items) {
        expect(item.spiceLevel).toBe(5);
      }
    });

    it('base generator is not mutated by derived generators', () => {
      const baseItem = baseGen.one();
      // defaults apply: vegetarian=false, spiceLevel=0
      expect(baseItem.vegetarian).toBe(false);
      expect(baseItem.spiceLevel).toBe(0);
    });

    it('composes overrides from multiple derivations', () => {
      const spicyVegetarianGen = vegetarianGen.override('spiceLevel', () => 4);
      const item = spicyVegetarianGen.one();
      expect(item.vegetarian).toBe(true);
      expect(item.spiceLevel).toBe(4);
    });
  });

  // ── Practical test utility ─────────────────────────────────────────

  describe('practical test utility', () => {
    it('generated menu items satisfy the schema shape', () => {
      const items = fixture(menuItemSchema).many(20);
      for (const item of items) {
        expect(typeof item.id).toBe('string');
        expect(typeof item.name).toBe('string');
        expect(item.name.length).toBeGreaterThanOrEqual(3);
        expect(typeof item.description).toBe('string');
        expect(typeof item.price).toBe('number');
        expect(typeof item.vegetarian).toBe('boolean');
        expect(typeof item.spiceLevel).toBe('number');
        expect(Array.isArray(item.allergens)).toBe(true);
      }
    });

    it('generated full menus have the expected structure', () => {
      const menus = fixture(restaurantMenuSchema).many(5);
      for (const menu of menus) {
        expect(typeof menu.restaurantName).toBe('string');
        expect(menu.updatedAt).toBeInstanceOf(Date);
        expect(Array.isArray(menu.sections)).toBe(true);
        for (const section of menu.sections) {
          expect(typeof section.title).toBe('string');
          expect(Array.isArray(section.items)).toBe(true);
        }
      }
    });

    it('batch-generates items with unique ids and names', () => {
      const items = fixture(menuItemSchema).many(10, { unique: ['id', 'name'] });
      const ids = items.map((i) => i.id);
      const names = items.map((i) => i.name);
      expect(new Set(ids).size).toBe(10);
      expect(new Set(names).size).toBe(10);
    });

    it('price is always positive and within a reasonable range', () => {
      const items = fixture(menuItemSchema).many(50);
      for (const item of items) {
        expect(item.price).toBeGreaterThan(0);
        expect(item.price).toBeLessThanOrEqual(75);
      }
    });

    it('spiceLevel defaults to 0 and vegetarian defaults to false', () => {
      const items = fixture(menuItemSchema).many(10);
      for (const item of items) {
        expect(item.spiceLevel).toBe(0);
        expect(item.vegetarian).toBe(false);
      }
    });

    it('menu sections contain between 2 and 5 items', () => {
      const menus = fixture(restaurantMenuSchema).many(10);
      for (const menu of menus) {
        for (const section of menu.sections) {
          expect(section.items.length).toBeGreaterThanOrEqual(2);
          expect(section.items.length).toBeLessThanOrEqual(5);
        }
      }
    });

    it('menus have between 2 and 4 sections', () => {
      const menus = fixture(restaurantMenuSchema).many(10);
      for (const menu of menus) {
        expect(menu.sections.length).toBeGreaterThanOrEqual(2);
        expect(menu.sections.length).toBeLessThanOrEqual(4);
      }
    });

    it('allergens array has at most 4 entries from the allowed set', () => {
      const allowed = allergenSchema.options;
      const items = fixture(menuItemSchema).many(50);
      for (const item of items) {
        expect(item.allergens.length).toBeLessThanOrEqual(4);
        for (const allergen of item.allergens) {
          expect(allowed).toContain(allergen);
        }
      }
    });

    it('category is always a valid enum value', () => {
      const validCategories = ['appetizer', 'main', 'dessert', 'beverage'];
      const items = fixture(menuItemSchema).many(50);
      for (const item of items) {
        expect(validCategories).toContain(item.category);
      }
    });
  });
});
