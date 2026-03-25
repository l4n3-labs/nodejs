import { fixture } from '@l4n3/zodgen';
import { z } from 'zod';

// Generate strings with specific formats

const email = fixture(z.email());
console.log('email:', email);

const url = fixture(z.url());
console.log('url:', url);

const uuid = fixture(z.uuid());
console.log('uuid:', uuid);

const ipv4 = fixture(z.ipv4());
console.log('ipv4:', ipv4);

const ipv6 = fixture(z.ipv6());

console.log('ipv6:', ipv6);

const datetime = fixture(z.iso.datetime());
console.log('datetime:', datetime);

const base64 = fixture(z.base64());
console.log('base64:', base64);

const emoji = fixture(z.emoji());
console.log('emoji:', emoji);

// String length constraints

const fixedLength = fixture(z.string().length(10));
console.log('fixed length (10):', fixedLength);

const bounded = fixture(z.string().min(5).max(15));
console.log('bounded (5-15):', bounded);

// String content constraints

const prefixed = fixture(z.string().startsWith('hello-'));
console.log('startsWith "hello-":', prefixed);

const suffixed = fixture(z.string().endsWith('-world'));
console.log('endsWith "-world":', suffixed);

const containing = fixture(z.string().includes('middle'));
console.log('includes "middle":', containing);
