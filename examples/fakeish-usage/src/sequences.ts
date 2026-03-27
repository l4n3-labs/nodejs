import { fixture } from '@l4n3/fakeish';
import { z } from 'zod';

// ctx.sequence provides an auto-incrementing counter during .many() calls.
// For .one(), sequence is always 0.

const postSchema = z.object({
  id: z.number(),
  slug: z.string(),
  title: z.string(),
  createdAt: z.iso.datetime(),
});

// Auto-incrementing IDs and sequential slugs

const gen = fixture(postSchema, { seed: 42 })
  .override('id', (ctx) => ctx.sequence + 1)
  .override('slug', (ctx) => `post-${ctx.sequence + 1}`);

const posts = gen.many(5);
console.log('Sequential posts:');
for (const post of posts) {
  console.log(`  #${post.id} — ${post.slug} — ${post.title}`);
}

// Monotonic timestamps using sequence

const eventSchema = z.object({
  id: z.number(),
  timestamp: z.iso.datetime(),
  type: z.enum(['click', 'view', 'purchase']),
});

const baseTime = new Date('2026-01-01T00:00:00Z').getTime();

const events = fixture(eventSchema, { seed: 1 })
  .override('id', (ctx) => ctx.sequence)
  .override('timestamp', (ctx) => new Date(baseTime + ctx.sequence * 60_000).toISOString())
  .many(5);

console.log('\nMonotonic timestamps:');
for (const event of events) {
  console.log(`  [${event.id}] ${event.timestamp} — ${event.type}`);
}

// For .one(), sequence is always 0

const single = fixture(postSchema)
  .override('id', (ctx) => ctx.sequence)
  .one();

console.log('\nSingle generation sequence:', single.id); // always 0
