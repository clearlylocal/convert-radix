import java.util.HashMap;
import java.io.BufferedReader;
import java.io.FileReader;
import java.util.ArrayList;

public class Tests {
	public static void main(String[] args) {
		Converter converter = new Converter();

		try {
			BufferedReader reader = new BufferedReader(new FileReader("./tests/fixtures/data.csv"));
			String line = reader.readLine();
			Boolean skip = true;

			ArrayList<String[]> data = new ArrayList<String[]>();

			while (line != null) {
				if (skip) {
					// skip header row
					skip = false;
					line = reader.readLine();
					continue;
				}

				String[] x = line.split(",");
				data.add(x);

				line = reader.readLine();
			}

			long start = System.currentTimeMillis();

			for (String[] x : data) {
				String base64 = x[0].trim();
				String friendly = x[1].trim();

				String actualFriendly = converter.convert(base64);
				String actualBase64 = converter.revert(friendly);

				if (!actualFriendly.equals(friendly)) {
					throw new Exception(String.format("'%s' != '%s'", actualFriendly, friendly));
				}
				if (!actualBase64.equals(base64)) {
					throw new Exception(String.format("'%s' != '%s'", actualBase64, base64));
				}
			}

			System.out.println(
				String.format("Finished %d rows in %d ms", data.size(), System.currentTimeMillis() - start)
			);

			reader.close();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
}

class Converter {
	private final Config config;
	private final Codec sourceCodec;
	private final Codec targetCodec;
	private final Codec checksCodec;
	private final CheckSumChecker checker;

	public Converter() {
		this(new Config());
	}

	public Converter(Config config) {
		this.config = config;
		this.sourceCodec = new Codec(config.source.alphabet);
		this.targetCodec = new Codec(config.target.alphabet);
		this.checksCodec = new Codec(config.checks.alphabet);
		this.checker = new CheckSumChecker(this.targetCodec.radix, this.checksCodec.radix);
	}

	public String convert(String text) throws Exception {
		long decoded = this.sourceCodec.decode(text);
		String encoded = this.targetCodec.encode(decoded);
		long checkSum = this.checker.getCheckSum(decoded);
		String checkDigit = this.checksCodec.encode(checkSum);
		if (checkDigit.length() == 0) {
			checkDigit = String.valueOf(this.checksCodec.zeroChar);
		}

		String result = String.format("%1$" + this.config.target.minLength + "s", encoded + checkDigit).replace(' ',
				this.targetCodec.zeroChar);

		return result;
	}

	public String revert(String text) throws Exception {
		if (text.isEmpty()) {
			throw new IllegalArgumentException("String cannot be empty");
		}

		String checkDigit = text.substring(text.length() - 1);
		long checkSum = this.checksCodec.decode(checkDigit);

		long decoded = this.targetCodec.decode(text.substring(0, text.length() - 1));

		long expectedCheckSum = this.checker.getCheckSum(decoded);
		if (checkSum != expectedCheckSum) {
			throw new IllegalArgumentException(
				String.format("Expected check sum %s; actual %s", expectedCheckSum, checkSum)
			);
		}

		String encoded = this.sourceCodec.encode(decoded);
		String result = String.format("%1$" + this.config.source.minLength + "s", encoded).replace(' ',
				this.sourceCodec.zeroChar);

		return result;
	}
}

class Codec {
	private final String alphabet;
	public final long radix;
	private final HashMap<Character, Long> values = new HashMap<Character, Long>();
	public final char zeroChar;

	public Codec(String alphabet) {
		this.alphabet = alphabet;
		this.radix = Long.valueOf(alphabet.length());
		this.zeroChar = alphabet.charAt(0);

		for (int i = 0; i < alphabet.length(); ++i) {
			values.put(alphabet.charAt(i), Long.valueOf(i));
		}
	}

	public long decode(String text) throws Exception {
		long total = 0;
		long length = Long.valueOf(text.length());

		for (int i = 0; i < text.length(); ++i) {
			char ch = text.charAt(i);
			long val = this.values.get(ch);
			if (Long.valueOf(val) == null) {
				throw new IllegalArgumentException(String.format("%s not found in alphabet", ch));
			}
			long place = length - Long.valueOf(i) - 1;
			total = total + val * (long) Math.pow(radix, place);
		}

		return total;
	}

	public String encode(long num) throws Exception {
		if (num < 0) {
			throw new IllegalArgumentException(String.format("%d is negative", num));
		}

		StringBuilder encoded = new StringBuilder();
		while (num > 0) {
			encoded.insert(0, this.alphabet.charAt((int) (num % this.radix)));
			num /= this.radix;
		}

		return encoded.toString();
	}
}

class CheckSumChecker {
	private final long radix;
	private final long mod;

	public CheckSumChecker(long radix, long mod) {
		this.radix = radix;
		this.mod = mod;
	}

	public long getCheckSum(long num) {
		long total = 0;
		long i = 1;

		while (num > 0) {
			total += (num % this.radix) * i;
			num /= this.radix;
			++i;
		}

		return total % this.mod;
	}
}

class Config {
	public final SourceConfig source;
	public final TargetConfig target;
	public final ChecksConfig checks;

	public Config() {
		// default values
		this(
			new SourceConfig("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 5),
			new TargetConfig("023456789abcdefghijkopqstuxy", 6),
			new ChecksConfig("023456789abcdefghijkopqstuxyz")
		);
	}

	public Config(SourceConfig source, TargetConfig target, ChecksConfig checks) {
		this.source = source;
		this.target = target;
		this.checks = checks;
	}

	public static class SourceConfig {
		public final String alphabet;
		public final int minLength;

		public SourceConfig(String alphabet, int minLength) {
			this.alphabet = alphabet;
			this.minLength = minLength;
		}
	}

	public static class TargetConfig {
		public final String alphabet;
		public final int minLength;

		public TargetConfig(String alphabet, int minLength) {
			this.alphabet = alphabet;
			this.minLength = minLength;
		}
	}

	public static class ChecksConfig {
		public final String alphabet;

		public ChecksConfig(String alphabet) {
			this.alphabet = alphabet;
		}
	}
}
