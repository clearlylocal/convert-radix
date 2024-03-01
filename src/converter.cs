using System;
using System.Numerics;
using System.Collections.Generic;

public class Converter {
	public Codec source;
	public Codec target;

	public Converter(string from, string to) {
		this.source = new Codec(from);
		this.target = new Codec(to);
	}

	public string Convert(string text) {
		var decoded = this.source.Decode(text);
		var converted = this.target.Encode(decoded);

		var numLeadingZeros = this.source.GetNumLeadingZeroChars(text);

		return new string(this.target.ZeroChar, numLeadingZeros) + converted;
	}
}

public class Codec {
	public uint Radix { get; private set; }
	public string Raw { get; private set; }
	public char[] Chars { get; private set; }
	public char ZeroChar { get; private set; }

	public Codec(string raw) {
		this.Raw = raw;
		this.Chars = raw.ToCharArray();

		if (new HashSet<char>(this.Chars).Count != this.Chars.Length) {
			throw new Exception("All chars in alphabet must be unique");
		}
		if (this.Chars.Length < 2) {
			throw new Exception("Alphabet must consist of at least 2 chars");
		}

		this.ZeroChar = this.Chars[0];
		this.Radix = (uint) this.Chars.Length;
	}
	
	public BigInteger Decode(string text) {
		var chars = text.ToCharArray();
		var length = chars.Length;
		var radix =  (BigInteger) this.Chars.Length;

		var total = (BigInteger) 0;

		for (int i = 0; i < length; i++) {
			var val = Array.IndexOf(this.Chars, chars[i]);
			if (val == -1) throw new Exception($"{chars[i]} not found in alphabet");
			var place = length - i - 1;
			total += (BigInteger) val * BigInteger.Pow(radix, place);
		}

		return total;
	}

	public string Encode(BigInteger num) {
		if (num < 0) throw new Exception($"{num} is negative");

		var radix = (BigInteger) this.Chars.Length;
		var encoded = "";

		var maxExponent = 0;
		while (BigInteger.Pow(radix, maxExponent) <= num) maxExponent++;

		for (var exponent = maxExponent - 1; exponent >= 0; --exponent) {
			var val = num / (BigInteger) BigInteger.Pow(radix, exponent);

			encoded += this.Chars[(int) val];
			num -= val * (BigInteger) BigInteger.Pow(radix, exponent);
		}

		return encoded;
	}

	public int GetNumLeadingZeroChars(string text) {
		var idx = 0;
		foreach (char c in text) {
			if (c != this.ZeroChar) return idx;
			idx++;
		}
		return idx;
	}
}

public static class Alphabet {
	public static readonly string Original = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	public static readonly string Friendly = "34679ACDEFGHJKLMNPQRTUVWXYabcdefghijkmnopqrstuvwxyz";
}

class Test {
	static void Main() {
		var text = "0000000Jkhsjk27389h9854dhsfjkh4ihJHJSDFHKJGFh7548";
		var converted = new Converter(Alphabet.Original, Alphabet.Friendly).Convert(text);
		var roundTripped = new Converter(Alphabet.Friendly, Alphabet.Original).Convert(converted);

		Console.WriteLine($"text: {text}");
		Console.WriteLine($"converted: {converted}");
		Console.WriteLine($"roundTripped: {roundTripped}");

		if (roundTripped != text) {
			throw new Exception($"{roundTripped} != {text}");
		}
	}
}
