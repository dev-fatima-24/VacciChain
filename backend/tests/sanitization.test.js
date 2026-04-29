const { sanitizeString, sanitizeDeep } = require('../src/middleware/sanitize');

describe('Input sanitization', () => {
  describe('sanitizeString', () => {
    it('strips HTML tags', () => {
      expect(sanitizeString('<script>alert("xss")</script>hello')).toBe('hello');
      expect(sanitizeString('foo<div>bar</div>baz')).toBe('foobarbaz');
      expect(sanitizeString('<!-- comment -->text')).toBe('text');
    });

    it('strips control characters', () => {
      expect(sanitizeString('hello\x01\x02world')).toBe('helloworld');
      expect(sanitizeString('foo\x7Fbar')).toBe('foobar');
    });

    it('preserves tab, newline, carriage return', () => {
      expect(sanitizeString('line1\nline2')).toBe('line1\nline2');
      expect(sanitizeString('col1\tcol2')).toBe('col1\tcol2');
      expect(sanitizeString('text\r\n')).toBe('text');
    });

    it('trims whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
      expect(sanitizeString('\n\ttext\t\n')).toBe('text');
    });

    it('throws on null bytes', () => {
      expect(() => sanitizeString('hello\x00world')).toThrow('null bytes');
    });

    it('returns non-strings unchanged', () => {
      expect(sanitizeString(123)).toBe(123);
      expect(sanitizeString(null)).toBe(null);
      expect(sanitizeString(undefined)).toBe(undefined);
    });
  });

  describe('sanitizeDeep', () => {
    it('sanitizes nested objects', () => {
      const input = {
        name: '<b>John</b>',
        address: { city: 'NYC\x01', zip: '10001' },
      };
      const output = sanitizeDeep(input);
      expect(output.name).toBe('John');
      expect(output.address.city).toBe('NYC');
      expect(output.address.zip).toBe('10001');
    });

    it('sanitizes arrays', () => {
      const input = ['<script>xss</script>', 'safe', 'text\x02'];
      const output = sanitizeDeep(input);
      expect(output).toEqual(['', 'safe', 'text']);
    });

    it('preserves non-string values', () => {
      const input = { count: 42, active: true, tags: [1, 2, 3] };
      const output = sanitizeDeep(input);
      expect(output).toEqual(input);
    });
  });
});
