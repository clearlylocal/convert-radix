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
	/** @param {Config} [config] */
	constructor(config) {
		/** @readonly */ this.config = config ?? defaultConfig

		/** @readonly */ this.sourceCodec = new Codec(this.config.source.alphabet)
		/** @readonly */ this.targetCodec = new Codec(this.config.target.alphabet)
		/** @readonly */ this.checksCodec = new Codec(this.config.checks.alphabet)
		/** @readonly */ this.checker = new CheckSumChecker(this.targetCodec.radix, this.checksCodec.radix)
	}

	/**
	 * @param {string} numberId - the Number ID to convert
	 * @returns {string} input converted from the source alphabet into the target alphabet, along with a check digit
	 * @throws if input text is invalid Number ID
	 */
	convert(numberId) {
		const decoded = this.sourceCodec.decode(numberId)
		const encoded = this.targetCodec.encode(decoded)
		const checkSum = this.checker.getCheckSum(decoded)
		const checkDigit = this.checksCodec.encode(checkSum) || this.checksCodec.zeroChar

		const friendlyId = (encoded + checkDigit).padStart(this.config.target.minLength, this.targetCodec.zeroChar)

		return friendlyId
	}

	/**
	 * @param {string} friendlyId - the text to revert
	 * @returns {string} input reverted from the target alphabet to the source alphabet
	 * @throws if check digit is wrong or if input text is invalid Friendly ID
	 */
	revert(friendlyId) {
		const checkDigit = friendlyId.at(-1)
		assert(checkDigit, 'Friendly ID cannot be empty')
		const checkSum = this.checksCodec.decode(checkDigit)

		const decoded = this.targetCodec.decode(friendlyId.slice(0, -1))

		const expectedCheckSum = this.checker.getCheckSum(decoded)
		assert(checkSum === expectedCheckSum, `Expected check sum ${expectedCheckSum}; actual ${checkSum}`)

		const encoded = this.sourceCodec.encode(decoded)
		const numberId = encoded.padStart(this.config.source.minLength, this.sourceCodec.zeroChar)

		return numberId
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
const defaultConfig = {
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

export { Alphabet, CheckSumChecker, Codec, Converter, defaultConfig }
