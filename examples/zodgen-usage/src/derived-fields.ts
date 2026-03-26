import { fixture } from '@l4n3/zodgen';
import { z } from 'zod';

// .derive() creates fields whose value depends on other generated fields.
// Derived fields are computed after all base fields are generated.

const userSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  username: z.string(),
  email: z.email(),
});

// Derive fullName from firstName + lastName, email from username

const gen = fixture(userSchema, { seed: 42 })
  .derive('fullName', (obj) => `${obj.firstName} ${obj.lastName}`)
  .derive('email', (obj) => `${obj.username}@example.com`);

const user = gen.one();
console.log('Derived user:');
console.log(`  Name: ${user.fullName} (from ${user.firstName} + ${user.lastName})`);
console.log(`  Email: ${user.email} (from ${user.username})`);

// Derivations work with overrides — overrides set base values, derivations compose

const admin = fixture(userSchema, { seed: 1 })
  .override('firstName', () => 'Admin')
  .override('lastName', () => 'User')
  .derive('fullName', (obj) => `${obj.firstName} ${obj.lastName}`)
  .derive('email', (obj) => `${obj.username}@admin.com`)
  .one();

console.log('\nAdmin user:');
console.log(`  Name: ${admin.fullName}`);
console.log(`  Email: ${admin.email}`);

// Derivations work with batch generation

const blogPostSchema = z.object({
  title: z.string(),
  slug: z.string(),
  author: z.string(),
});

const posts = fixture(blogPostSchema, { seed: 7 })
  .derive('slug', (obj) =>
    obj.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, ''),
  )
  .many(3);

console.log('\nBlog posts with derived slugs:');
for (const post of posts) {
  console.log(`  "${post.title}" → /${post.slug}`);
}
