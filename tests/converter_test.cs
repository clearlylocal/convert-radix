using System;
using static Converter;
using System.IO;

class Test {
	static void Main() {
		var b62ToB42 = new Converter(Alphabet.Base62, Alphabet.Base42);
		var b42ToB62 = new Converter(Alphabet.Base42, Alphabet.Base62);

		var reader = new StreamReader("./tests/fixtures/data.csv");
		var isHeader = true;
		while (true) {
			var line = reader.ReadLine();

			if (isHeader) {
				isHeader = false;
				continue;
			}

			if (line == null) break;
			if (line == "") continue;

			var cols = line.Split(",");
			var id = cols[0].Trim();
			var b42 = cols[1].Trim();

			var converted = b62ToB42.Convert(id);

			if (converted != b42) {
				throw new Exception($"{converted} != {b42}");
			}

			var roundTripped = b42ToB62.Convert(converted);

			if (roundTripped != id) {
				throw new Exception($"{roundTripped} != {id}");
			}
		}
		reader.Close();

		Console.WriteLine($"All tests passed ✅");
	}
}
