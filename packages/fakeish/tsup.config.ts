import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/formats/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  noExternal: ['@l4n3/fakeish-gen-core'],
  external: ['@faker-js/faker', 'zod'],
});
