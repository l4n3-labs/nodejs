import StyleDictionary from 'style-dictionary';
import { config } from './config.ts';

const sd = new StyleDictionary(config);
await sd.buildAllPlatforms();
