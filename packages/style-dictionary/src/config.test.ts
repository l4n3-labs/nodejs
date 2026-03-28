import { describe, expect, it } from 'vitest';
import { config } from './config.js';

describe('config', () => {
  it('has source globs for tokens and components', () => {
    expect(config.source).toEqual(['src/tokens/**/!(*test).ts', 'src/components/**/!(*test).ts']);
  });

  it('defines css, scss, and json platforms', () => {
    expect(config.platforms).toBeDefined();
    expect(Object.keys(config.platforms ?? {})).toEqual(['css', 'scss', 'json']);
  });

  it('outputs to dist/tokens/', () => {
    expect(config.platforms).toBeDefined();
    for (const platform of Object.values(config.platforms ?? {})) {
      expect(platform.buildPath).toMatch(/^dist\/tokens\//);
    }
  });
});
