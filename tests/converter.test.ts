import { parse } from 'std/csv/mod.ts'
import { assertEquals } from 'std/assert/mod.ts'

Deno.test('converter.js', async (t) => {
	const { Alphabet, Converter } = await import('../src/converter.js')

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
})

Deno.test('converter.py', async () => {
	const output = await new Deno.Command('python', {
		args: ['-m', 'tests.converter_test'],
		stdout: 'piped',
		stderr: 'piped',
	}).output()

	const [info, error] = [output.stdout, output.stderr].map((x) => new TextDecoder().decode(x))
	const outputs = { info, error }
	console.info('Python test output:')
	for (const [k, v] of Object.entries(outputs)) console[k as keyof typeof outputs](v)

	if (!output.success) {
		throw new Error(`Python test exited with status ${output.code}`)
	}
})

Deno.test('converter.cs', async () => {
	for (
		const [name, command] of Object.entries({
			build: new Deno.Command('mcs', {
				args: ['-r:System.Numerics.dll', '-out:converter.exe', 'src/converter.cs'],
				stdout: 'piped',
				stderr: 'piped',
			}),
			test: new Deno.Command('mono', {
				args: ['converter.exe'],
				stdout: 'piped',
				stderr: 'piped',
			}),
		})
	) {
		const output = await command.output()

		const [info, error] = [output.stdout, output.stderr].map((x) => new TextDecoder().decode(x))
		const outputs = { info, error }
		console.info(`C# ${name} output:`)
		for (const [k, v] of Object.entries(outputs)) console[k as keyof typeof outputs](v)

		if (!output.success) {
			throw new Error(`C# ${name} exited with status ${output.code}`)
		}
	}
})
