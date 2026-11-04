"""Vérifie la hiérarchie SVG et les attaches sans dépendre du client propriétaire."""
import importlib.util
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('composition', Path(__file__).parents[1]/'scripts/prepare-composition.py')
c = importlib.util.module_from_spec(spec); spec.loader.exec_module(c)

class CompositionExportTest(unittest.TestCase):
 def test_nested_order_hair_and_affine(self):
  svg = '''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:ff="https://www.free-decompiler.com/flash"><g transform="matrix(1,0,0,1,500,500)"><use xlink:href="#actor" transform="matrix(2,0,0,2,0,0)"/></g><defs><g id="actor"><use ff:characterId="50" xlink:href="#empty" transform="matrix(1,0,0,1,3,4)"/><path d="M0 0L5 5"/><g id="cCra_S_Cheveux"><path d="M0 0L2 2"/></g><use ff:characterId="56" xlink:href="#empty" transform="matrix(1,0.2,0.3,1,0,-20)"/></g><g id="empty"/></defs></svg>'''
  with tempfile.TemporaryDirectory() as directory:
   path=Path(directory)/'frame.svg';path.write_text(svg)
   layers=c.split_frame(path,{50:('cape','R'),56:('hat','S')})
  self.assertEqual([layer.get('slot','hair' if layer.get('hideWithHat') else 'body') for layer in layers],['cape','body','hair','hat'])
  self.assertEqual(layers[0]['matrix'],[2,0,0,2,6,8])
  self.assertEqual(layers[-1]['matrix'],[2,0.4,0.6,2,0,-40])
  self.assertIn('matrix(2,0,0,2,0,0)',layers[1]['svg'])
  self.assertNotIn('500',layers[1]['svg'])

 def test_matrix_multiplication(self):
  self.assertEqual(c.multiply([0,1,-1,0,5,7],[2,0,0,3,4,6]),[0,2,-3,0,-1,11])

if __name__=='__main__':unittest.main()
