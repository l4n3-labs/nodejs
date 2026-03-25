import { z } from 'zod/v4';

// Tier 1: Primitives
export const PrimitiveSchema = z.object({
  text: z.string(),
  count: z.number(),
  flag: z.boolean(),
});

// Tier 2: Simple object with common field types
export const SimpleObjectSchema = z.object({
  name: z.string(),
  email: z.email(),
  age: z.number().int().min(18).max(99),
  active: z.boolean(),
});

// Tier 3: Heavily constrained fields
export const ConstrainedSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  username: z.string().min(3).max(20),
  bio: z.string().min(10).max(200),
  score: z.number().int().min(0).max(1000).multipleOf(5),
  rating: z.number().min(0).max(5).multipleOf(0.5),
  prefix: z.string().startsWith('usr_'),
  slug: z.string().min(3).max(30),
});

// Tier 4: Nested object with arrays, enums, optional/nullable
export const NestedObjectSchema = z.object({
  id: z.uuid(),
  name: z.string().max(255),
  email: z.email(),
  role: z.enum(['admin', 'editor', 'viewer']),
  profile: z.object({
    bio: z.string().max(500),
    avatar: z.url(),
    settings: z.object({
      theme: z.enum(['light', 'dark']),
      notifications: z.boolean(),
      language: z.string().length(2),
    }),
  }),
  tags: z.array(z.string()).min(1).max(5),
  metadata: z.object({
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime().optional(),
    deletedAt: z.iso.datetime().nullable(),
  }),
});

// Tier 5: Recursive schema
type TreeNode = {
  readonly value: string;
  readonly children: ReadonlyArray<TreeNode>;
};

export const RecursiveSchema: z.ZodType<TreeNode> = z.object({
  value: z.string(),
  children: z.array(z.lazy(() => RecursiveSchema)),
});

export type PrimitiveType = z.infer<typeof PrimitiveSchema>;
export type SimpleObjectType = z.infer<typeof SimpleObjectSchema>;
export type ConstrainedType = z.infer<typeof ConstrainedSchema>;
export type NestedObjectType = z.infer<typeof NestedObjectSchema>;
export type TreeNodeType = TreeNode;
