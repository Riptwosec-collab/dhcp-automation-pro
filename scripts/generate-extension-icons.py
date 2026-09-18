import struct
import zlib
from pathlib import Path

SIZES = (16, 32, 48, 128, 512)
OUT = Path('chrome-extension/icons')


def chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)


def write_png(path: Path, size: int, rows: list[bytes]) -> None:
    raw = b''.join(b'\x00' + row for row in rows)
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9))
    png += chunk(b'IEND', b'')
    path.write_bytes(png)


def pixel(size: int, x: int, y: int) -> tuple[int, int, int, int]:
    bg = (3, 6, 10, 255)
    cyan = (34, 211, 238, 255)
    gold = (245, 197, 66, 255)
    soft = (10, 24, 34, 255)

    border = max(1, size // 16)
    inset = max(border + 1, size // 8)
    if x < border or y < border or x >= size - border or y >= size - border:
        return cyan
    if x < inset or y < inset or x >= size - inset or y >= size - inset:
        return soft

    left = size * 0.32
    right = size * 0.70
    top = size * 0.25
    bottom = size * 0.75
    thick = max(1.0, size * 0.105)
    in_stem = left <= x < left + thick and top <= y < bottom
    in_top = left <= x < right - thick * 0.25 and top <= y < top + thick
    in_bottom = left <= x < right - thick * 0.25 and bottom - thick <= y < bottom
    in_right = right - thick <= x < right and top + thick * 0.45 <= y < bottom - thick * 0.45
    if in_stem or in_top or in_bottom or in_right:
        return gold
    return bg


def render(size: int) -> list[bytes]:
    rows = []
    for y in range(size):
        row = bytearray()
        for x in range(size):
            row.extend(pixel(size, x, y))
        rows.append(bytes(row))
    return rows


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for size in SIZES:
        path = OUT / f'icon{size}.png'
        write_png(path, size, render(size))
        print(path)


if __name__ == '__main__':
    main()
