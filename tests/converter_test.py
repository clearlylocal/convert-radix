import unittest
from pandas import read_csv

# import sys
# sys.path.append('../src')
# from src import converter
# Converter = converter.Converter
# Alphabet = converter.Alphabet
from src.converter import Converter, Alphabet

class TestConvert(unittest.TestCase):
    def test_convert(self):
        b62_to_b42 = Converter(Alphabet.Base62.value, Alphabet.Base42.value)
        b42_to_b62 = Converter(Alphabet.Base42.value, Alphabet.Base62.value)

        for _, row in read_csv('./tests/fixtures/data.csv').iterrows():
            converted = b62_to_b42.convert(row['base62'])
            self.assertEqual(converted, row['base42'])
            round_tripped = b42_to_b62.convert(converted)
            self.assertEqual(round_tripped, row['base62'])

if __name__ == '__main__':
    unittest.main()
