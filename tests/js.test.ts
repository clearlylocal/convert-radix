import { parse } from 'std/csv/mod.ts'
import { assert, assertEquals, assertThrows } from 'std/assert/mod.ts'
import { Alphabet, Codec, Converter } from '../src/converter.js'

Deno.test('data.csv', async () => {
	const columns = ['base62', 'base42'] as const
	const data = parse(await Deno.readTextFile('./tests/fixtures/data.csv'), { columns, skipFirstRow: true })
	const b62ToB42 = new Converter(Alphabet.Base62, Alphabet.Base42)
	const b42ToB62 = new Converter(Alphabet.Base42, Alphabet.Base62)

	for (const { base62, base42 } of data) {
		const converted = b62ToB42.convert(base62)
		assertEquals(converted, base42)
		const roundTripped = b42ToB62.convert(converted)
		assertEquals(roundTripped, base62)
	}
})

Deno.test('Alphabet', async (t) => {
	for (const [_name, alphabet] of Object.entries(Alphabet)) {
		const name = _name as keyof typeof Alphabet

		await t.step(name, async (t) => {
			await t.step('all chars unique', () => {
				assertEquals([...new Set([...alphabet])].join(''), alphabet)
			})

			await t.step('lexicographically sorted', () => {
				assertEquals(alphabet, [...alphabet].sort().join(''))
				assertEquals(alphabet, [...alphabet].sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!).join(''))
			})

			await t.step('only ASCII alphanumeric', () => {
				assert(!/[^0-9A-Za-z]/.test(alphabet))
			})

			await t.step('radix matches name', () => {
				const radix = BigInt(name.replace(/^Base/, ''))
				assert(new Codec(alphabet).radix === radix)
			})
		})
	}
})

Deno.test('Codec', async (t) => {
	await t.step('decode', () => assertEquals(new Codec('01').decode('1101'), 13n))
	await t.step('encode', () => assertEquals(new Codec('01').encode(13n), '1101'))
	await t.step('radix', () => assertEquals(new Codec('01').radix, 2n))
	await t.step('chars', () => assertEquals(new Codec('01').chars, ['0', '1']))
	await t.step('zeroChar', () => assertEquals(new Codec('01').zeroChar, '0'))

	await t.step('invalid constructor', async (t) => {
		await t.step('alphabet empty', () => void assertThrows(() => new Codec('')))
		await t.step('alphabet too short', () => void assertThrows(() => new Codec('0')))
		await t.step('alphabet non-unique', () => void assertThrows(() => new Codec('010')))
	})

	await t.step('invalid inputs', async (t) => {
		const codec = new Codec('01')

		await t.step('encoding negative number', () => void assertThrows(() => codec.encode(-1n)))
		await t.step('decoding char not in alphabet', () => void assertThrows(() => codec.decode('102')))
	})

	await t.step('zeros', () => {
		const repetitionCounts = [1, 5, 10]
		const alphabets = ['01', '0123456789', 'abc', '345678']
		for (const alphabet of alphabets) {
			const codec = new Codec(alphabet)

			// zero always encodes to empty string
			assertEquals(codec.encode(0n), '')
			// empty string always decodes to zero
			assertEquals(codec.decode(''), 0n)

			for (const count of repetitionCounts) {
				// any number of zero chars always decodes to zero
				const zeros = codec.zeroChar.repeat(count)
				assertEquals(codec.decode(zeros), 0n)
			}
		}
	})

	await t.step('parity with JS built-ins', () => {
		function makeAlphabet(radix: number) {
			if (radix > 36) throw new RangeError('max radix for JS built-ins is 36')
			return Array.from(
				{ length: radix },
				(_, i) => i < 10 ? String(i) : String.fromCodePoint(i - 10 + 'a'.codePointAt(0)!),
			).join('')
		}

		const radixes = [2, 10, 16, 36]
		for (const radix of radixes) {
			const nums = [0, 1, 10, 42, 99, 100, 999, 1000, radix, radix - 1, radix ** 2, radix ** 2 - 1]
			const codec = new Codec(makeAlphabet(radix))
			for (const num of nums) {
				const stringified = num.toString(radix)
				assertEquals(codec.encode(BigInt(num)) || codec.zeroChar, stringified)
				assertEquals(Number(codec.decode(stringified)), parseInt(stringified, radix))
			}
		}
	})

	await t.step('TS types', async (t) => {
		const codec = new Codec('01')
		const _decode: (x: string) => bigint = codec.decode.bind(codec)
		const _encode: (x: bigint) => string = codec.encode.bind(codec)
		const _alphabet: string = codec.alphabet
		const _chars: string[] = codec.chars
		const _radix: bigint = codec.radix
		const _values: Map<string, bigint> = codec.values
		const _zeroChar: string = codec.zeroChar

		await t.step('props are readonly', () => {
			void (() => {
				// @ts-expect-error read-only property
				codec.alphabet = {} as unknown as typeof codec.alphabet
				// @ts-expect-error read-only property
				codec.chars = {} as unknown as typeof codec.chars
				// @ts-expect-error read-only property
				codec.radix = {} as unknown as typeof codec.radix
				// @ts-expect-error read-only property
				codec.values = {} as unknown as typeof codec.values
				// @ts-expect-error read-only property
				codec.zeroChar = {} as unknown as typeof codec.zeroChar
			})
		})
	})
})

Deno.test('Converter', async (t) => {
	await t.step('binary to decimal', () => {
		const abcToXyz = new Converter('01', '0123456789')

		assertEquals(abcToXyz.convert('1101'), '13')
		assertEquals(abcToXyz.convert('001101'), '0013')
	})

	await t.step('decimal to hex', () => {
		const abcToXyz = new Converter('0123456789', '0123456789abcdef')

		assertEquals(abcToXyz.convert('255'), 'ff')
		assertEquals(abcToXyz.convert('000255'), '000ff')
	})

	await t.step('ternary "abc" to ternary "xyz"', () => {
		const abcToXyz = new Converter('abc', 'xyz')

		assertEquals(abcToXyz.convert('bbccaa'), 'yyzzxx')
		assertEquals(abcToXyz.convert('aabbccaa'), 'xxyyzzxx')
	})

	await t.step('TS types', async (t) => {
		const converter = new Converter('01', '0123456789')
		const _source: Codec = converter.source
		const _target: Codec = converter.target
		const _convert: (x: string) => string = converter.convert.bind(converter)

		await t.step('props are readonly', () => {
			void (() => {
				// @ts-expect-error read-only property
				converter.source = {} as unknown as typeof converter.source
				// @ts-expect-error read-only property
				converter.target = {} as unknown as typeof converter.target
			})
		})
	})
})
