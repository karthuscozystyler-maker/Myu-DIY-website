from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json
import requests
from PIL import Image

ROOT = Path('/home/ubuntu/wallplay')
SOURCE = Path('/home/ubuntu/console_outputs/exec_result_2026-10-28_10-27-14_755.txt')
OUT = ROOT / 'client/public/content/source'
OUT.mkdir(parents=True, exist_ok=True)
rows = json.loads(SOURCE.read_text())


def download(row):
    index = row['i']
    if index == 0:
        return None
    # The exact responsive size exposed by the source DOM, or its original src.
    url = row['current'] or row['src']
    response = requests.get(url, timeout=60)
    response.raise_for_status()
    path = OUT / f'detail-{index:02d}.webp'
    path.write_bytes(response.content)
    with Image.open(path) as image:
        metadata = {
            'index': index, 'source': url, 'localPath': str(path.relative_to(ROOT)),
            'width': image.width, 'height': image.height,
            'format': image.format, 'frames': getattr(image, 'n_frames', 1),
            'alt': row['alt'], 'originalLink': row.get('link'),
            'bytes': path.stat().st_size,
        }
    print(f"detail-{index:02d}: {metadata['width']}x{metadata['height']} {metadata['frames']} frames {metadata['bytes']} bytes", flush=True)
    return metadata


with ThreadPoolExecutor(max_workers=4) as pool:
    results = [item for item in pool.map(download, rows) if item]
(ROOT / 'design-references').mkdir(exist_ok=True)
(ROOT / 'design-references/detail-media-sources.json').write_text(
    json.dumps({'page': 'https://www.themyumyu.com/pages/magnetic-storage', 'media': results}, ensure_ascii=False, indent=2) + '\n'
)
# Internal overview only. Re-encodes existing pixels without text overlays.
thumbs = []
for item in results:
    with Image.open(ROOT / item['localPath']) as image:
        image.seek(0)
        thumb = image.convert('RGB')
        thumb.thumbnail((360, 450))
        cell = Image.new('RGB', (360, 470), 'white')
        cell.paste(thumb, ((360-thumb.width)//2, (470-thumb.height)//2))
        thumbs.append(cell)
columns = 4
montage = Image.new('RGB', (360*columns, 470*((len(thumbs)+columns-1)//columns)), 'white')
for index, thumb in enumerate(thumbs):
    montage.paste(thumb, ((index%columns)*360, (index//columns)*470))
montage.save(ROOT / 'design-references/detail-media-overview.jpg', quality=90)
print('Source index and internal overview saved.', flush=True)
