import type { Faker } from '@faker-js/faker';

const normalize = (name: string): string => name.replace(/_/g, '').toLowerCase();

type SemanticGenerator<T> = (faker: Faker) => T;

const stringSemantics: ReadonlyMap<string, SemanticGenerator<string>> = new Map([
  ['firstname', (f) => f.person.firstName()],
  ['lastname', (f) => f.person.lastName()],
  ['name', (f) => f.person.fullName()],
  ['fullname', (f) => f.person.fullName()],
  ['username', (f) => f.internet.username()],
  ['phone', (f) => f.phone.number()],
  ['phonenumber', (f) => f.phone.number()],
  ['address', (f) => f.location.streetAddress()],
  ['street', (f) => f.location.street()],
  ['streetaddress', (f) => f.location.streetAddress()],
  ['city', (f) => f.location.city()],
  ['state', (f) => f.location.state()],
  ['country', (f) => f.location.country()],
  ['zipcode', (f) => f.location.zipCode()],
  ['zip', (f) => f.location.zipCode()],
  ['postalcode', (f) => f.location.zipCode()],
  ['company', (f) => f.company.name()],
  ['companyname', (f) => f.company.name()],
  ['title', (f) => f.person.jobTitle()],
  ['jobtitle', (f) => f.person.jobTitle()],
  ['description', (f) => f.lorem.paragraph()],
  ['bio', (f) => f.lorem.paragraph()],
  ['summary', (f) => f.lorem.paragraph()],
  ['about', (f) => f.lorem.paragraph()],
  ['color', (f) => f.color.human()],
  ['avatar', (f) => f.image.url()],
  ['image', (f) => f.image.url()],
  ['photo', (f) => f.image.url()],
  ['picture', (f) => f.image.url()],
]);

const numberSemantics: ReadonlyMap<string, SemanticGenerator<number>> = new Map([
  ['age', (f) => f.number.int({ min: 18, max: 80 })],
  ['price', (f) => f.number.float({ min: 1, max: 999, fractionDigits: 2 })],
  ['amount', (f) => f.number.float({ min: 1, max: 999, fractionDigits: 2 })],
  ['cost', (f) => f.number.float({ min: 1, max: 999, fractionDigits: 2 })],
  ['quantity', (f) => f.number.int({ min: 1, max: 100 })],
  ['count', (f) => f.number.int({ min: 1, max: 100 })],
  ['latitude', (f) => f.location.latitude()],
  ['lat', (f) => f.location.latitude()],
  ['longitude', (f) => f.location.longitude()],
  ['lng', (f) => f.location.longitude()],
  ['lon', (f) => f.location.longitude()],
]);

export const findSemanticString = (fieldName: string): SemanticGenerator<string> | undefined =>
  stringSemantics.get(normalize(fieldName));

export const findSemanticNumber = (fieldName: string): SemanticGenerator<number> | undefined =>
  numberSemantics.get(normalize(fieldName));
