import { fixture } from '@l4n3/fakeish';
import { z } from 'zod';

// Restaurant menu schemas — interconnected types that model a full menu.

export const allergenSchema = z.enum(['gluten', 'dairy', 'nuts', 'shellfish', 'soy', 'eggs']);

export const menuItemSchema = z.object({
  id: z.uuid(),
  name: z.string().min(3).max(50),
  description: z.string().min(10).max(200),
  price: z.number().positive().min(1).max(75).multipleOf(0.01),
  category: z.enum(['appetizer', 'main', 'dessert', 'beverage']),
  vegetarian: z.boolean().default(false),
  spiceLevel: z.number().int().min(0).max(5).default(0),
  allergens: z.array(allergenSchema).max(4),
});

export const menuSectionSchema = z.object({
  title: z.string(),
  items: z.array(menuItemSchema).min(2).max(5),
});

export const restaurantMenuSchema = z.object({
  restaurantName: z.string(),
  updatedAt: z.date(),
  sections: z.array(menuSectionSchema).min(2).max(4),
});

// --- Defaults ---
// Fields with .default() always produce their default value.
// vegetarian defaults to false, spiceLevel defaults to 0.

const item = fixture(menuItemSchema).one();
console.log('menu item with defaults:');
console.log('  vegetarian:', item.vegetarian, '(default: false)');
console.log('  spiceLevel:', item.spiceLevel, '(default: 0)');

// --- Overrides ---
// String key override — force every item to be a dessert

const dessertGen = fixture(menuItemSchema).override('category', () => 'dessert' as const);

const dessert = dessertGen.one();
console.log('\ndessert override:', dessert.category);

// Predicate override — set a fixed price for all number fields matching "price"

const fixedPriceGen = fixture(menuItemSchema).override(
  (ctx) => ctx.path.at(-1) === 'price',
  () => 9.99,
);

const fixedPriceItem = fixedPriceGen.one();
console.log('fixed price override:', fixedPriceItem.price);

// Combining overrides — dessert menu with fixed pricing

const dessertMenuGen = fixture(menuItemSchema)
  .override('category', () => 'dessert' as const)
  .override('price', () => 12.5);

const specialDessert = dessertMenuGen.one();
console.log('combined overrides:', { category: specialDessert.category, price: specialDessert.price });

// --- Uniqueness ---
// Generate a batch of menu items with guaranteed unique IDs and names.

const uniqueItems = fixture(menuItemSchema).many(5, { unique: ['id', 'name'] });
const ids = uniqueItems.map((i) => i.id);
const names = uniqueItems.map((i) => i.name);
console.log('\n5 unique items:');
console.log('  all IDs unique?', new Set(ids).size === 5);
console.log('  all names unique?', new Set(names).size === 5);
console.log('  ids:', ids);

// --- Full menu generation ---
// Generate a complete restaurant menu with a pinned restaurant name.

const menuGen = fixture(restaurantMenuSchema).override('restaurantName', () => 'The Golden Fork');

const menu = menuGen.one();
console.log('\nfull menu:', JSON.stringify(menu, null, 2));
