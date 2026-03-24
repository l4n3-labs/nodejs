import { fixture } from '@l4n3/zodgen';
import { z } from 'zod';

// Recursive schemas use z.lazy() and automatically stop at depth >= 3.

// Tree structure

type TreeNode = {
  readonly value: string;
  readonly children: ReadonlyArray<TreeNode>;
};

const treeSchema: z.ZodType<TreeNode> = z.object({
  value: z.string(),
  children: z.array(z.lazy(() => treeSchema)),
});

const tree = fixture(treeSchema);
console.log('tree:', JSON.stringify(tree, null, 2));

// Linked list

type ListNode = {
  readonly data: number;
  readonly next: ListNode | null;
};

const listSchema: z.ZodType<ListNode> = z.object({
  data: z.number().int().min(0).max(100),
  next: z.lazy(() => listSchema).nullable(),
});

const list = fixture(listSchema);
console.log('linked list:', JSON.stringify(list, null, 2));

// Comment thread (nested replies)

type Comment = {
  readonly author: string;
  readonly body: string;
  readonly replies: ReadonlyArray<Comment>;
};

const commentSchema: z.ZodType<Comment> = z.object({
  author: z.string(),
  body: z.string(),
  replies: z.array(z.lazy(() => commentSchema)),
});

const thread = fixture(commentSchema);
console.log('comment thread:', JSON.stringify(thread, null, 2));
