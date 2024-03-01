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
