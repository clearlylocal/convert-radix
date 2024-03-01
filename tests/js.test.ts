import { parse } from 'std/csv/mod.ts'
import { assertEquals, assertThrows } from 'std/assert/mod.ts'
import { Alphabet, Codec, Converter } from '../src/converter.js'

Deno.test('Codec', async (t) => {
	await t.step('decode', () => assertEquals(new Codec('01').decode('1101'), 13n))
	await t.step('encode', () => assertEquals(new Codec('01').encode(13n), '1101'))
	await t.step('radix', () => assertEquals(new Codec('01').radix, 2))
	await t.step('chars', () => assertEquals(new Codec('01').chars, ['0', '1']))
	await t.step('zeroChar', () => assertEquals(new Codec('01').zeroChar, '0'))

	await t.step('alphabet empty', () => void assertThrows(() => new Codec('')))
	await t.step('alphabet too short', () => void assertThrows(() => new Codec('0')))
	await t.step('alphabet non-unique', () => void assertThrows(() => new Codec('010')))

	await t.step('TS types', () => {
		const codec = new Codec('01')
		const _decode: (x: string) => bigint = codec.decode.bind(codec)
		const _encode: (x: bigint) => string = codec.encode.bind(codec)
		const _radix: number = codec.radix
		const _chars: string[] = codec.chars
		const _zeroChar: string = codec.zeroChar
		const _alphabet: string = codec.alphabet
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

	await t.step('data.csv', async () => {
		const columns = ['id', 'friendly'] as const
		const data = parse(await Deno.readTextFile('./tests/fixtures/data.csv'), { columns, skipFirstRow: true })
		const originalToFriendly = new Converter(Alphabet.Original, Alphabet.Friendly)
		const friendlyToOriginal = new Converter(Alphabet.Friendly, Alphabet.Original)

		for (const { id, friendly } of data) {
			const converted = originalToFriendly.convert(id)
			assertEquals(converted, friendly)
			const roundTripped = friendlyToOriginal.convert(converted)
			assertEquals(roundTripped, id)
		}
	})

	await t.step('TS types', () => {
		const converter = new Converter('01', '0123456789')
		const _source: Codec = converter.source
		const _target: Codec = converter.target
		const _convert: (x: string) => string = converter.convert.bind(converter)
	})
})
