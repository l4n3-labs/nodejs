import { fixture } from '@l4n3/fakeish';
import { z } from 'zod';

// .maxDepth() controls how deep recursive schemas are generated.
// Once the depth limit is reached, collections produce empty arrays
// and nullable fields produce null.

type TreeNode = {
  readonly value: string;
  readonly children: ReadonlyArray<TreeNode>;
};

const treeSchema: z.ZodType<TreeNode> = z.object({
  value: z.string(),
  children: z.array(z.lazy(() => treeSchema)),
});

// Shallow tree — depth 1 means children are empty arrays

const shallow = fixture(treeSchema, { seed: 42 }).maxDepth(1).one();
console.log('Shallow (maxDepth 1):');
console.log(JSON.stringify(shallow, null, 2));

// Default depth (10) — generates a deep tree

const defaultDepth = fixture(treeSchema, { seed: 42 }).one();
console.log('\nDefault depth:');
console.log(JSON.stringify(defaultDepth, null, 2));

// Custom depth — deeper nesting

const deep = fixture(treeSchema, { seed: 42 }).maxDepth(5).one();
console.log('\nDeep (maxDepth 5):');
console.log(JSON.stringify(deep, null, 2));

// Via FixtureOptions

const viaOptions = fixture(treeSchema, { seed: 42, maxDepth: 2 }).one();
console.log('\nVia options (maxDepth 2):');
console.log(JSON.stringify(viaOptions, null, 2));
