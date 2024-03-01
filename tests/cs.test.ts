Deno.test('converter.cs', async () => {
	for (
		const [name, command] of Object.entries({
			build: new Deno.Command('mcs', {
				args: ['-r:System.Numerics.dll', '-out:converter.exe', 'src/converter.cs', 'tests/converter_test.cs'],
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
		if (info || error) {
			console.info(`C# ${name} output:`)
			for (const [k, v] of Object.entries(outputs)) console[k as keyof typeof outputs](v)
		}

		if (!output.success) {
			throw new Error(`C# ${name} exited with status ${output.code}`)
		}
	}
})
