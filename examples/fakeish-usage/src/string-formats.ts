import { fixture } from '@l4n3/fakeish';
import { z } from 'zod';

// Generate strings with specific formats

const email = fixture(z.email()).one();
console.log('email:', email);

const url = fixture(z.url()).one();
console.log('url:', url);

const uuid = fixture(z.uuid()).one();
console.log('uuid:', uuid);

const ipv4 = fixture(z.ipv4()).one();
console.log('ipv4:', ipv4);

const ipv6 = fixture(z.ipv6()).one();
console.log('ipv6:', ipv6);

const datetime = fixture(z.iso.datetime()).one();
console.log('datetime:', datetime);

const base64 = fixture(z.base64()).one();
console.log('base64:', base64);

const emoji = fixture(z.emoji()).one();
console.log('emoji:', emoji);

// String length constraints

const fixedLength = fixture(z.string().length(10)).one();
console.log('fixed length (10):', fixedLength);

const bounded = fixture(z.string().min(5).max(15)).one();
console.log('bounded (5-15):', bounded);

// String content constraints

const prefixed = fixture(z.string().startsWith('hello-')).one();
console.log('startsWith "hello-":', prefixed);

const suffixed = fixture(z.string().endsWith('-world')).one();
console.log('endsWith "-world":', suffixed);

const containing = fixture(z.string().includes('middle')).one();
console.log('includes "middle":', containing);
