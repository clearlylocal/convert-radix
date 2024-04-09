Deno.test('Converter.java', async () => {
	for (
		const [name, command] of Object.entries({
			test: new Deno.Command('java', {
				args: [
					'src/Converter.java',
				],
				stdout: 'piped',
				stderr: 'piped',
			}),
		})
	) {
		const output = await command.output()

		const [info, error] = [output.stdout, output.stderr].map((x) => new TextDecoder().decode(x))
		const outputs = { info, error }
		if (info || error) {
			console.info(`Java ${name} output:`)
			for (const [k, v] of Object.entries(outputs)) console[k as keyof typeof outputs](v)
		}

		if (!output.success) {
			throw new Error(`Java ${name} exited with status ${output.code}`)
		}
	}
})
