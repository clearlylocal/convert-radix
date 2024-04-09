// @ts-check

/**
 * @typedef {{
 * 	source: { alphabet: string, minLength: number },
 * 	target: { alphabet: string, minLength: number },
 * 	checks: { alphabet: string }
 * }} Config
 */

/**
 * @typedef {{ kind: 'ok', result: string } | { kind: 'error', message: string }} Result
 */

class Converter {
	/** @param {Config} config */
	constructor(config) {
		/** @readonly */ this.config = config

		/** @readonly */ this.sourceCodec = new Codec(config.source.alphabet)
		/** @readonly */ this.targetCodec = new Codec(config.target.alphabet)
		/** @readonly */ this.checksCodec = new Codec(config.checks.alphabet)
		/** @readonly */ this.checker = new CheckSumChecker(this.targetCodec.radix, this.checksCodec.radix)
	}

	/**
	 * @param {string} text - the text to convert
	 * @returns {Result} text converted from the source alphabet into the target alphabet, along with a check digit
	 */
	convert(text) {
		try {
			const decoded = this.sourceCodec.decode(text)
			const encoded = this.targetCodec.encode(decoded)
			const checkSum = this.checker.getCheckSum(decoded)
			const checkDigit = this.checksCodec.encode(checkSum).padStart(1, this.checksCodec.zeroChar)

			const result = (encoded + checkDigit).padStart(this.config.target.minLength, this.targetCodec.zeroChar)

			return { kind: 'ok', result }
		} catch (e) {
			return { kind: 'error', message: String(e?.message ?? e) }
		}
	}

	/**
	 * @param {string} text - the text to revert
	 * @returns {Result} text reverted from the target alphabet to the source alphabet
	 */
	revert(text) {
		try {
			const checkDigit = text.at(-1)
			assert(checkDigit, 'string cannot be empty')
			const checkSum = this.checksCodec.decode(checkDigit)

			const decoded = this.targetCodec.decode(text.slice(0, -1))

			const expectedCheckSum = this.checker.getCheckSum(decoded)
			assert(checkSum === expectedCheckSum, `Expected check sum ${expectedCheckSum}; actual ${checkSum}`)

			const encoded = this.sourceCodec.encode(decoded)
			const result = encoded.padStart(this.config.source.minLength, this.sourceCodec.zeroChar)

			return { kind: 'ok', result }
		} catch (e) {
			return { kind: 'error', message: String(e?.message ?? e) }
		}
	}
}

class Codec {
	/** @param {string} alphabet */
	constructor(alphabet) {
		/** @readonly */ this.alphabet = alphabet
		/** @readonly */ this.chars = [...alphabet]

		/** @readonly */ this.radix = BigInt(this.chars.length)
		/** @readonly */ this.values = new Map(this.chars.map((char, idx) => [char, BigInt(idx)]))
		/** @readonly */ this.zeroChar = this.chars[0]
	}

	/** @param {string} text */
	decode(text) {
		const chars = [...text]
		const length = BigInt(chars.length)

		let total = 0n

		for (const [idx, char] of chars.entries()) {
			const val = this.values.get(char)
			assert(val != null, `${char} not found in alphabet`)
			const place = length - BigInt(idx) - 1n
			total += val * this.radix ** place
		}

		return total
	}

	/** @param {bigint} num */
	encode(num) {
		assert(num >= 0n, `${num} is negative`)

		/** @type {string[]} */
		const encoded = []

		while (num) {
			encoded.push(this.chars[Number(num % this.radix)])
			// floor division
			num /= this.radix
		}

		return encoded.reverse().join('')
	}

	/** @param {string} text */
	getNumLeadingZeroChars(text) {
		let idx = 0
		for (const char of text) {
			if (char !== this.zeroChar) return idx
			;++idx
		}
		return idx
	}
}

class CheckSumChecker {
	/**
	 * @param {bigint} radix - must be integer > 1
	 * @param {bigint} mod - must be positive, prime integer > radix
	 */
	constructor(radix, mod) {
		this.radix = radix
		this.mod = mod
	}

	/** @param {bigint} num */
	getCheckSum(num) {
		// based on [ISBN-10 algorithm](https://en.wikipedia.org/wiki/ISBN#ISBN-10_check_digits)
		let total = 0n

		let i = 1n
		while (num) {
			total += (num % this.radix) * i
			num /= this.radix
			;++i
		}

		return total % this.mod
	}
}

/**  @enum {typeof Alphabet[keyof typeof Alphabet]} */
const Alphabet = /** @type {const} */ ({
	/** https://en.wikipedia.org/wiki/Base62 */
	Source: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	/** Base 28; lowercase only, OCR/human input optimized alphabet with ambiguous-looking chars removed */
	Target: '023456789abcdefghijkopqstuxy',
	/** Base 29; Target + 'z' */
	Checks: '023456789abcdefghijkopqstuxyz',
})

/** @type {Config} */
const config = {
	source: { alphabet: Alphabet.Source, minLength: 5 },
	target: { alphabet: Alphabet.Target, minLength: 6 },
	checks: { alphabet: Alphabet.Checks },
}

/**
 * @param {unknown} condition
 * @param {string} [message]
 * @returns {asserts condition}
 */
function assert(condition, message) {
	if (!condition) throw new Error(message ?? 'Condition failed')
}

export { Alphabet, CheckSumChecker, Codec, config, Converter }
