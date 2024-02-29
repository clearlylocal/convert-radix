// @ts-check

class Converter {
	#source
	#target

	/**
	 * @param {string} from the alphabet to convert from
	 * @param {string} to the alphabet to convert to
	 */
	constructor(from, to) {
		this.from = from
		this.to = to
		this.#source = new Codec(from)
		this.#target = new Codec(to)
	}

	/**
	 * @param {string} text
	 * @returns input converted from source alphabet into target alphabet
	 */
	convert(text) {
		const decoded = this.#source.decode(text)
		const converted = this.#target.encode(decoded)

		const numLeadingZeros = this.#source.getNumLeadingZeroChars(text)

		return this.#target.zeroChar.repeat(numLeadingZeros) + converted
	}
}

class Codec {
	/** @param {string} alphabet */
	constructor(alphabet) {
		this.alphabet = alphabet
		this.chars = [...alphabet]

		if (this.chars.length < 2) throw new RangeError('Alphabet must consist of at least 2 chars')
		if (new Set(this.chars).size !== this.chars.length) throw new TypeError('All chars in alphabet must be unique')

		this.zeroChar = this.chars[0]
	}

	/** @param {string} text */
	decode(text) {
		const chars = [...text]
		const length = BigInt(chars.length)
		const radix = BigInt(this.chars.length)

		let total = 0n

		for (const [idx, char] of chars.entries()) {
			const val = this.chars.indexOf(char)
			if (val === -1) throw new RangeError(`${char} not found in alphabet`)
			const place = length - BigInt(idx) - 1n
			total += BigInt(val) * radix ** place
		}

		return total
	}

	/** @param {bigint} num */
	encode(num) {
		if (num < 0n) throw new RangeError(`${num} is negative`)

		const radix = BigInt(this.chars.length)
		let encoded = ''

		let maxExponent = 0n
		while (radix ** maxExponent <= num) ++maxExponent

		for (let exponent = maxExponent - 1n; exponent >= 0n; --exponent) {
			const val = num / radix ** exponent

			encoded += this.chars[Number(val)]
			num -= val * radix ** exponent
		}

		return encoded
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

/**  @enum {typeof Alphabet[keyof typeof Alphabet]} */
const Alphabet = /** @type {const} */ ({
	Original: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	Friendly: '34679ACDEFGHJKLMNPQRTUVWXYabcdefghijkmnopqrstuvwxyz',
})

export { Alphabet, Codec, Converter }
