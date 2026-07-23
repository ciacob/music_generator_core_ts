import { describe, expect, it } from 'vitest';
import {
  capitalize,
  fromAS3ConstantCase,
  generateRFC4122GUID,
  isAny,
  padLeft,
  padRight,
  sprintf,
  toAS3ConstantCase,
  trim,
  trimLeft,
  trimRight,
} from '../../src/utils/Strings.js';

describe('padLeft / padRight', () => {
  it('pads on the correct side until the target length', () => {
    expect(padLeft('7', '0', 3)).toBe('007');
    expect(padRight('7', '0', 3)).toBe('700');
  });

  it('is a no-op when already at or past the target length', () => {
    expect(padLeft('1234', '0', 3)).toBe('1234');
  });
});

describe('trim / trimLeft / trimRight', () => {
  it('trims both sides', () => {
    expect(trim('  hi  ')).toBe('hi');
  });

  it('trims only the left side', () => {
    expect(trimLeft('  hi  ')).toBe('hi  ');
  });

  it('trims only the right side', () => {
    expect(trimRight('  hi  ')).toBe('  hi');
  });

  it('returns an empty string for null/undefined input', () => {
    expect(trim(null)).toBe('');
    expect(trim(undefined)).toBe('');
    expect(trimLeft(null)).toBe('');
    expect(trimRight(null)).toBe('');
  });
});

describe('capitalize', () => {
  it('capitalizes only the first word by default', () => {
    expect(capitalize('hello world')).toBe('Hello world');
  });

  it('capitalizes every word when all=true', () => {
    expect(capitalize('hello world', true)).toBe('Hello World');
  });

  it('trims leading whitespace before capitalizing', () => {
    expect(capitalize('  hello')).toBe('Hello');
  });
});

describe('isAny', () => {
  it('is true when the string matches any alternative', () => {
    expect(isAny('b', 'a', 'b', 'c')).toBe(true);
  });

  it('is false when there is no match', () => {
    expect(isAny('z', 'a', 'b', 'c')).toBe(false);
  });

  it('is false with no alternatives given', () => {
    expect(isAny('a')).toBe(false);
  });
});

describe('fromAS3ConstantCase', () => {
  it('converts SCREAMING_SNAKE_CASE to lowercase space-separated words', () => {
    expect(fromAS3ConstantCase('MY_STRING_VALUE')).toBe('my string value');
  });

  it('collapses repeated underscores', () => {
    expect(fromAS3ConstantCase('A__B')).toBe('a b');
  });
});

describe('toAS3ConstantCase', () => {
  it('converts camelCase to SCREAMING_SNAKE_CASE', () => {
    expect(toAS3ConstantCase('myStringValue')).toBe('MY_STRING_VALUE');
  });

  it('converts space-separated words to SCREAMING_SNAKE_CASE', () => {
    expect(toAS3ConstantCase('my string value')).toBe('MY_STRING_VALUE');
  });

  it('collapses non-word runs into a single underscore', () => {
    expect(toAS3ConstantCase('foo--bar!!baz')).toBe('FOO_BAR_BAZ');
  });
});

describe('generateRFC4122GUID', () => {
  it('produces the expected template shape with a fixed RNG', () => {
    const guid = generateRFC4122GUID(() => 0.5);
    expect(guid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('is deterministic for a fixed RNG', () => {
    const a = generateRFC4122GUID(() => 0.25);
    const b = generateRFC4122GUID(() => 0.25);
    expect(a).toBe(b);
  });

  it('varies with the RNG output', () => {
    const a = generateRFC4122GUID(() => 0.1);
    const b = generateRFC4122GUID(() => 0.9);
    expect(a).not.toBe(b);
  });
});

describe('sprintf', () => {
  it('interpolates a %s string argument', () => {
    expect(sprintf('Hello, %s!', 'world')).toBe('Hello, world!');
  });

  it('interpolates multiple arguments in order', () => {
    expect(sprintf('%s is %d years old', 'Ada', 36)).toBe('Ada is 36 years old');
  });

  it('formats negative integers with a leading minus', () => {
    expect(sprintf('%d', -5)).toBe('-5');
  });

  it('applies the + flag to non-negative integers', () => {
    expect(sprintf('%+d', 5)).toBe('+5');
    expect(sprintf('%+d', -5)).toBe('-5');
  });

  it('zero-pads integers to a field width', () => {
    expect(sprintf('%05d', 42)).toBe('00042');
  });

  it('left-justifies with the - flag', () => {
    expect(sprintf('[%-5d]', 42)).toBe('[42   ]');
  });

  it('applies precision (minimum digit count) to integers', () => {
    expect(sprintf('%.4d', 42)).toBe('0042');
  });

  it('formats hexadecimal with %x and %X', () => {
    expect(sprintf('%x', 255)).toBe('ff');
    expect(sprintf('%X', 255)).toBe('FF');
  });

  it('prepends 0x for the alternate form of hex', () => {
    expect(sprintf('%#x', 255)).toBe('0xff');
  });

  it('does not prepend 0x for a zero value even with the alternate flag', () => {
    expect(sprintf('%#x', 0)).toBe('0');
  });

  it('formats octal with %o', () => {
    expect(sprintf('%o', 8)).toBe('10');
  });

  it('formats unsigned with %u', () => {
    expect(sprintf('%u', 42)).toBe('42');
  });

  it('formats floats with a default precision of 6', () => {
    expect(sprintf('%f', 3.14)).toBe('3.140000');
  });

  it('formats floats with an explicit precision', () => {
    expect(sprintf('%.2f', 3.14159)).toBe('3.14');
  });

  it('formats a character with %c', () => {
    expect(sprintf('%c', 65)).toBe('A');
  });

  it('escapes a literal percent with %%', () => {
    expect(sprintf('100%%')).toBe('100%');
  });

  it('truncates strings via precision', () => {
    expect(sprintf('%.3s', 'hello')).toBe('hel');
  });

  it('passes through text with no conversion specifiers unchanged', () => {
    expect(sprintf('no specifiers here')).toBe('no specifiers here');
  });
});
