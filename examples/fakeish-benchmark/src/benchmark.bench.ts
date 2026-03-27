import { bench, describe } from 'vitest';
import { createFakeishAdapter } from './adapters/fakeish.js';
import { createZockerAdapter } from './adapters/zocker.js';
import { createZodFixtureAdapter } from './adapters/zod-fixture.js';
import { createZodMockingAdapter } from './adapters/zod-mocking.js';
import { createZodSchemaFakerAdapter } from './adapters/zod-schema-faker.js';
import { createZodockAdapter } from './adapters/zodock.js';
import {
  ConstrainedSchema,
  NestedObjectSchema,
  PrimitiveSchema,
  RecursiveSchema,
  SimpleObjectSchema,
} from './schemas.js';

// Initialize adapters at module level (vitest supports top-level await)
const allAdapters = await Promise.all([
  createFakeishAdapter(),
  createZodSchemaFakerAdapter(),
  createZockerAdapter(),
  createZodFixtureAdapter(),
  createZodMockingAdapter(),
  createZodockAdapter(),
]);

const available = allAdapters.filter((a) => a.available);
const recursive = available.filter((a) => a.supportsRecursive);

console.log('\n=== Adapter Availability ===');
for (const adapter of allAdapters) {
  const status = adapter.available ? 'AVAILABLE' : `UNAVAILABLE (${adapter.reason})`;
  console.log(`  ${adapter.name}: ${status}`);
}
console.log('');

describe('single generation - primitive object', () => {
  for (const adapter of available) {
    bench(adapter.name, () => {
      adapter.generate(PrimitiveSchema);
    });
  }
});

describe('single generation - simple object', () => {
  for (const adapter of available) {
    bench(adapter.name, () => {
      adapter.generate(SimpleObjectSchema);
    });
  }
});

describe('single generation - constrained object', () => {
  for (const adapter of available) {
    bench(adapter.name, () => {
      adapter.generate(ConstrainedSchema);
    });
  }
});

describe('single generation - nested object', () => {
  for (const adapter of available) {
    bench(adapter.name, () => {
      adapter.generate(NestedObjectSchema);
    });
  }
});

describe('single generation - recursive tree', () => {
  for (const adapter of recursive) {
    bench(adapter.name, () => {
      adapter.generate(RecursiveSchema);
    });
  }
});

describe('batch generation - 10 simple objects', () => {
  for (const adapter of available) {
    bench(adapter.name, () => {
      adapter.generateMany(SimpleObjectSchema, 10);
    });
  }
});

describe('batch generation - 100 simple objects', () => {
  for (const adapter of available) {
    bench(adapter.name, () => {
      adapter.generateMany(SimpleObjectSchema, 100);
    });
  }
});

describe('batch generation - 1000 simple objects', () => {
  for (const adapter of available) {
    bench(adapter.name, () => {
      adapter.generateMany(SimpleObjectSchema, 1000);
    });
  }
});

describe('batch generation - 100 constrained objects', () => {
  for (const adapter of available) {
    bench(adapter.name, () => {
      adapter.generateMany(ConstrainedSchema, 100);
    });
  }
});

describe('batch generation - 100 nested objects', () => {
  for (const adapter of available) {
    bench(adapter.name, () => {
      adapter.generateMany(NestedObjectSchema, 100);
    });
  }
});
