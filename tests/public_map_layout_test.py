import hashlib
import importlib.util
from pathlib import Path
import unittest

spec=importlib.util.spec_from_file_location('public_layout',Path(__file__).resolve().parents[1]/'scripts/public_map_layout.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)


class PublicLayoutTest(unittest.TestCase):
    def setUp(self):
        self.data='Hhaaeaaaaa'*479
        self.config={'id':'11892','date':'0712071740','layoutSha256':hashlib.sha256(self.data.encode()).hexdigest()}

    def row(self,data=None,key='ignored'):
        return f"INSERT INTO `maps` VALUES ('11892', '0712071740', '15', '17', '', '{key}', '{data or self.data}');"

    def test_uses_only_the_already_clear_layout_regardless_of_key_field(self):
        first=module.parse_clear_map_data(self.row(key='not-a-key'),self.config)
        second=module.parse_clear_map_data(self.row(key='different-unused-text'),self.config)
        self.assertEqual(first,self.data);self.assertEqual(first,second)

    def test_refuses_encoded_or_modified_data_instead_of_decrypting_it(self):
        for data in ['%protected%',self.data[:-1]+'b']:
            with self.subTest(data=data[:12]),self.assertRaisesRegex(RuntimeError,'aucun déchiffrement'):
                module.parse_clear_map_data(self.row(data=data),self.config)

    def test_refuses_ambiguous_rows(self):
        with self.assertRaisesRegex(RuntimeError,'ambiguë'):
            module.parse_clear_map_data(self.row()+'\n'+self.row(),self.config)

    def test_metadata_contributes_only_dimensions_and_original_background(self):
        script=module.public_layout_script(self.data,'width = 15; height = 17; backgroundNum = 71; mapData = "not-used";')
        self.assertIn('backgroundNum = 71;',script);self.assertIn(self.data,script);self.assertNotIn('not-used',script)
