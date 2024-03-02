using System;
using System.Linq;
using System.Numerics;
using System.Collections.Generic;

public class Converter {
	public Codec Source { get; private set; }
	public Codec Target { get; private set; }

	public Converter(string from, string to) {
		this.Source = new Codec(from);
		this.Target = new Codec(to);
	}

	public string Convert(string text) {
		var decoded = this.Source.Decode(text);
		var converted = this.Target.Encode(decoded);

		var numLeadingZeros = this.Source.GetNumLeadingZeroChars(text);

		return new string(this.Target.ZeroChar, numLeadingZeros) + converted;
	}
}

public class Codec {
	public string Alphabet { get; private set; }
	public char[] Chars { get; private set; }
	public Dictionary<char, BigInteger> Values { get; private set; }
	public char ZeroChar { get; private set; }
	public BigInteger Radix { get; private set; }

	public Codec(string alphabet) {
		this.Alphabet = alphabet;
		this.Chars = alphabet.ToCharArray();

		if (new HashSet<char>(this.Chars).Count != this.Chars.Length) {
			throw new Exception("All chars in alphabet must be unique");
		}
		if (this.Chars.Length < 2) {
			throw new Exception("Alphabet must consist of at least 2 chars");
		}

		this.Radix = (BigInteger) this.Chars.Length;
		this.Values = alphabet
			.Select((value, index) => new { value, index })
            .ToDictionary((pair) => pair.value, pair => (BigInteger) pair.index);
		this.ZeroChar = this.Chars[0];
	}

	public BigInteger Decode(string text) {
		var chars = text.ToCharArray();
		var length = chars.Length;

		var total = (BigInteger) 0;

		for (int i = 0; i < length; i++) {
			BigInteger val;
			if (this.Values.TryGetValue(chars[i], out val)) {
				var place = length - i - 1;
				total += val * BigInteger.Pow(this.Radix, place);
			} else {
				throw new Exception($"{chars[i]} not found in alphabet");
			}
		}

		return total;
	}

	public string Encode(BigInteger num) {
		if (num < 0) throw new Exception($"{num} is negative");

		var encoded = new List<char>();

		while (num > 0) {
			encoded.Add(this.Chars[(int) (num % this.Radix)]);
			num /= this.Radix;
		}

		encoded.Reverse();
		return String.Join("", encoded);
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
	public static readonly string Base62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	public static readonly string Base42 = "34679ACDEFGHJKLMNPQRTUXYabefghijkopqstuxyz";
}
