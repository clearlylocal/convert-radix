// @ts-check

class Converter {
	/**
	 * @param {string} from - the source alphabet to convert from
	 * @param {string} to - the target alphabet to convert into
	 */
	constructor(from, to) {
		this.source = new Codec(from)
		this.target = new Codec(to)
	}

	/**
	 * @param {string} text - the text to convert
	 * @returns text converted from the source alphabet into the target alphabet
	 */
	convert(text) {
		const decoded = this.source.decode(text)
		const converted = this.target.encode(decoded)

		const numLeadingZeros = this.source.getNumLeadingZeroChars(text)

		return this.target.zeroChar.repeat(numLeadingZeros) + converted
	}
}

class Codec {
	/** @param {string} alphabet */
	constructor(alphabet) {
		this.alphabet = alphabet
		this.chars = [...alphabet]

		if (new Set(this.chars).size !== this.chars.length) throw new TypeError('All chars in alphabet must be unique')
		if (this.chars.length < 2) throw new RangeError('Alphabet must consist of at least 2 chars')

		this.zeroChar = this.chars[0]
		this.radix = this.chars.length
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
		/** @type {string[]} */
		const encoded = []

		while (num) {
			encoded.push(this.chars[Number(num % radix)])
			// floor division
			num /= radix
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

/**  @enum {typeof Alphabet[keyof typeof Alphabet]} */
const Alphabet = /** @type {const} */ ({
	/** https://en.wikipedia.org/wiki/Base62 */
	Base62: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	/** OCR-optimized alphabet with ambiguous-looking chars 0/O, l/1/I, 2/Z, 5/S, B/8, m/rn, d/cl, w/vv, W/VV removed */
	Base42: '34679ACDEFGHJKLMNPQRTUXYabefghijkopqstuxyz',
})

export { Alphabet, Codec, Converter }
