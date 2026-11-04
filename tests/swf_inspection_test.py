"""Fixtures SWF structurelles sans graphismes ni code ActionScript tiers."""
import importlib.util
import struct
import unittest
import zlib
from pathlib import Path

spec = importlib.util.spec_from_file_location('inspector', Path(__file__).parents[1] / 'scripts/inspect-client.py')
inspector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inspector)


def tag(code, payload=b''):
    size = len(payload)
    return struct.pack('<H', (code << 6) | (size if size < 63 else 63)) + (struct.pack('<I', size) if size >= 63 else b'') + payload


def fixture(compressed=False, stop=False):
    # Un wrapper d'une frame, qui place une timeline de trois frames.
    nested = tag(39, struct.pack('<HH', 1, 3) + tag(43, b'cycle\0') + tag(1) + (tag(12, b'\x07\x00') if stop else b'') + tag(1) * 2 + tag(0))
    wrapper = tag(39, struct.pack('<HH', 2, 1) + tag(26, b'\x02' + struct.pack('<HH', 1, 1)) + tag(1) + tag(0))
    export = tag(56, struct.pack('<HH', 1, 2) + b'runS\0')
    data = b'\x08\x00' + struct.pack('<HH', 20 * 256, 1) + nested + wrapper + export + tag(1) + tag(0)
    return (b'CWS' if compressed else b'FWS') + b'\x06' + struct.pack('<I', len(data) + 8) + (zlib.compress(data) if compressed else data)


class InspectionTests(unittest.TestCase):
    def test_preserves_nested_animation_length(self):
        info = inspector.inspect_swf(fixture())
        self.assertEqual(info['fps'], 20)
        self.assertEqual(info['symbols']['runS']['frameCount'], 1)
        self.assertEqual(info['symbols']['runS']['maxNestedFrames'], 3)

    def test_honors_literal_stop_before_empty_tail(self):
        info = inspector.inspect_swf(fixture(stop=True))
        self.assertEqual(info['symbols']['runS']['maxNestedFrames'], 3)
        self.assertEqual(info['symbols']['runS']['playbackFrames'], 2)

    def test_compressed_and_plain_match(self):
        self.assertEqual(inspector.inspect_swf(fixture()), inspector.inspect_swf(fixture(True)))

    def test_rejects_truncated_tag(self):
        with self.assertRaisesRegex(ValueError, 'tronqué'):
            list(inspector.tags(struct.pack('<H', (39 << 6) | 10), 0))

    def test_rejects_unsupported_container(self):
        with self.assertRaises(ValueError):
            inspector.inspect_swf(b'not a swf')


if __name__ == '__main__':
    unittest.main()
