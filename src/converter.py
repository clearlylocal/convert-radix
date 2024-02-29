from enum import Enum

class Codec:
    def __init__(self, alphabet: str):
        self.alphabet = alphabet
        self.chars = list(alphabet)

        if len(self.chars) < 2:
            raise ValueError('Alphabet must consist of at least 2 chars')
        if len(self.chars) != len(set(self.chars)):
            raise ValueError('All chars in alphabet must be unique')

        self.zero_char = self.chars[0]
        
    def decode(self, text: str) -> int:
        length = len(text)
        radix = len(self.chars)

        total = 0

        for idx, char in enumerate(text):
            val = self.chars.index(char)
            place = length - idx - 1
            total += val * (radix ** place)

        return total

    def encode(self, num: int) -> str:
        if num < 0:
            raise ValueError(f"{num} is negative")

        radix = len(self.chars)
        encoded = ''

        max_exponent = 0
        while radix ** max_exponent <= num:
            max_exponent += 1

        for exponent in range(max_exponent - 1, -1, -1):
            val = num // (radix ** exponent)

            encoded += self.chars[val]
            num -= val * (radix ** exponent)

        return encoded

    def get_num_leading_zero_chars(self, text: str) -> int:
        idx = 0
        for char in text:
            if char != self.zero_char:
                return idx
            idx += 1
        return idx

class Converter:
    def __init__(self, from_alphabet: str, to_alphabet: str):
        self.from_alphabet = from_alphabet
        self.to_alphabet = to_alphabet
        self.__source = Codec(from_alphabet)
        self.__target = Codec(to_alphabet)

    def convert(self, text: str) -> str:
        decoded = self.__source.decode(text)
        converted = self.__target.encode(decoded)

        num_leading_zeros = self.__source.get_num_leading_zero_chars(text)

        return self.__target.zero_char * num_leading_zeros + converted

class Alphabet(Enum):
    Original = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    Friendly = '34679ACDEFGHJKLMNPQRTUVWXYabcdefghijkmnopqrstuvwxyz'
