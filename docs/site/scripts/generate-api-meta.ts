import { readdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const apiDir = join(import.meta.dirname, '..', 'content', 'api');

const entries = readdirSync(apiDir, { withFileTypes: true })
  .filter((entry) => entry.name !== '_meta.ts')
  .map((entry) => (entry.isDirectory() ? entry.name : basename(entry.name, '.mdx')));

const record = entries.map((name) => `  '${name}': '${name}',`).join('\n');

const content = `import type { MetaRecord } from 'nextra';

const meta: MetaRecord = {
${record}
};

export default meta;
`;

writeFileSync(join(apiDir, '_meta.ts'), content);
