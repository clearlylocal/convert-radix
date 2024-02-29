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
        original_to_friendly = Converter(Alphabet.Original.value, Alphabet.Friendly.value)
        friendly_to_original = Converter(Alphabet.Friendly.value, Alphabet.Original.value)
        
        for _, row in read_csv('./tests/fixtures/data.csv').iterrows():
            converted = original_to_friendly.convert(row['id'])
            self.assertEqual(converted, row['friendly'])
            round_tripped = friendly_to_original.convert(converted)
            self.assertEqual(round_tripped, row['id'])

if __name__ == '__main__':
    unittest.main()
