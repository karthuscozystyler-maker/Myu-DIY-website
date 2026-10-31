from pathlib import Path
from PIL import Image
import json

ROOT = Path('/home/ubuntu/wallplay')
PREP = Path('/home/ubuntu/myu-preparation')
OUT = ROOT / 'client/public/products'
DATA = ROOT / 'client/src/configurator'
OUT.mkdir(exist_ok=True, parents=True)
legacy_keys = {'六勾架': 'hooks', '刀架': 'knife', '瓶子收納架': 'bottles'}
manifest = json.loads((PREP / 'accessories-20261029/manifest.json').read_text())
public = json.loads((PREP / 'catalog-public-source-20261029.json').read_text())
known_skus = {row['SKU'] for row in public['accessories']}


def positive_cm(value):
    return value if isinstance(value, (int, float)) and not isinstance(value, bool) and 0 < value < 200 else None


def price(value):
    return value if isinstance(value, (int, float)) and not isinstance(value, bool) and 0 < value < 10000 else None


def normalize_series(value):
    if isinstance(value, list):
        raw = value
    elif isinstance(value, str):
        raw = value.replace('／', '/').replace('、', '/').split('/')
    else:
        raw = []
    mapping = {
        'entry': 'entry', '玄關': 'entry', '玄關系列': 'entry',
        'kitchen': 'kitchen', '廚房': 'kitchen', '廚房系列': 'kitchen',
        'bathroom': 'bathroom', '浴室': 'bathroom', '浴室系列': 'bathroom',
        'desk': 'desk', '書檯': 'desk', '書檯/化妝檯': 'desk', '書檯/化妝檯系列': 'desk',
        '化妝檯': 'desk', '化妝檯系列': 'desk',
    }
    result = []
    for item in raw:
        key = str(item).strip()
        if key in mapping and mapping[key] not in result:
            result.append(mapping[key])
    return result


def prepare_cutout(source, target):
    with Image.open(source) as image:
        image = image.convert('RGBA')
        alpha = image.getchannel('A')
        if alpha.getextrema()[0] != 0:
            # A few earlier reference renders arrived with a flat opaque background.
            # Apply the same conservative corner-background cleanup used for supplied originals.
            corners = [(2, 2), (image.width - 3, 2), (2, image.height - 3), (image.width - 3, image.height - 3)]
            samples = [image.getpixel(point)[:3] for point in corners]
            background = tuple(sorted(pixel[channel] for pixel in samples)[len(samples) // 2] for channel in range(3))
            pixels = image.load()
            for y in range(image.height):
                for x in range(image.width):
                    r, g, b, _ = pixels[x, y]
                    distance = ((r - background[0]) ** 2 + (g - background[1]) ** 2 + (b - background[2]) ** 2) ** 0.5
                    pixels[x, y] = (r, g, b, 0 if distance <= 7 else min(255, int((distance - 7) * 22)))
            alpha = image.getchannel('A')
        box = alpha.getbbox()
        if not box:
            raise ValueError(f'Empty product reference: {source}')
        x0, y0, x1, y1 = box
        box = (max(0, x0 - 8), max(0, y0 - 8), min(image.width, x1 + 8), min(image.height, y1 + 8))
        image = image.crop(box)
        image.thumbnail((760, 760), Image.Resampling.LANCZOS)
        image.save(target, 'WEBP', quality=84, method=6)


catalog = {}
images = []
specs = []
for family in manifest['families']:
    ident = family['id']
    directory = PREP / 'catalog-20261029' / ident
    spec_path = directory / 'spec.json'
    if not spec_path.exists():
        raise ValueError(f'Missing verified specification: {spec_path}')
    spec = json.loads(spec_path.read_text())
    width = positive_cm(spec.get('width_cm', spec.get('wall_plane_width_cm')))
    height = positive_cm(spec.get('height_cm', spec.get('wall_plane_height_cm')))
    depth = positive_cm(spec.get('depth_cm'))
    key = legacy_keys.get(family['name'], ident)
    skus = spec.get('skus', {})
    prices = spec.get('prices', {})
    for finish in ('cream', 'charcoal'):
        sku = skus.get(finish)
        if sku is not None and sku not in known_skus:
            raise ValueError(f'Unrecognized source SKU: {family["name"]}: {sku}')
        source = directory / (finish + '.png')
        if not source.exists():
            raise ValueError(f'Missing final product reference: {source}')
        target = OUT / f'{ident}-{finish}-front.webp'
        prepare_cutout(source, target)
        images.append({
            'type': 'accessory', 'key': key, 'finish': finish, 'file': str(target),
            'filename': target.name, 'fallbackOriginal': finish in spec.get('fallback_image_notes', {}),
        })
    series = normalize_series(spec.get('series', []))
    if not series:
        raise ValueError(f'Unverified series in {family["name"]}: {spec.get("series")}')
    name = spec.get('name') or family['name'].replace('_', ' ')
    raw_short = spec.get('short')
    short = raw_short.strip() if isinstance(raw_short, str) and raw_short.strip() else name.replace('_', ' ')
    catalog[key] = {
        'name': name,
        'short': short,
        'width': round(width * 10) if width else 0,
        'height': round(height * 10) if height else 0,
        'depth': round(depth * 10) if depth else None,
        'dimensionsVerified': bool(width and height),
        'price': price(prices.get('cream')),
        'prices': {finish: price(prices.get(finish)) for finish in ('cream', 'charcoal')},
        'description': '按產品標示尺寸規劃，圖片僅供外觀參考。',
        'packSize': 1,
        'series': series,
        'skus': {finish: skus.get(finish) for finish in ('cream', 'charcoal')},
    }
    specs.append({'id': ident, 'key': key, **spec})

# The single-color four-pack tin was previously supplied and is intentionally retained.
catalog['tin'] = {
    'name': '圓形小鐵盒', 'short': '小鐵盒', 'width': 85, 'height': 85, 'depth': 30,
    'dimensionsVerified': True, 'price': 138, 'prices': {'cream': 138, 'charcoal': 138},
    'description': '每盒四個；畫布上一個代表一個實物。', 'packSize': 4,
    'series': ['kitchen'], 'skus': {'cream': 'myu-lego-circle', 'charcoal': 'myu-lego-circle'},
}
text = '/* Public catalog: source specifications only; costs and margins are excluded. */\n'
text += 'export const ACCESSORY_DATA = ' + json.dumps(catalog, ensure_ascii=False, indent=2) + ' as const;\n'
text += 'export type AccessoryId = keyof typeof ACCESSORY_DATA;\n'
(DATA / 'catalog-data.ts').write_text(text)

fabric_manifest = json.loads((PREP / 'fabrics-20261029/manifest.json').read_text())
fabrics = public['fabrics']
for item in fabric_manifest['files']:
    if item['type'] != 'individual_fabric':
        continue
    matches = [row for row in fabrics if row['花色'] == item['name']]
    if len(matches) != 1:
        raise ValueError(f'Fabric does not have one exact source-name match: {item["name"]}')
    row = matches[0]
    key = {'經典奶茶格紋': 'gingham', '沐慕小花磚': 'floral'}.get(item['name'], 'fabric-' + row['代碼'])
    target = OUT / f'fabric-{key}.webp'
    with Image.open(item['path']) as image:
        image = image.convert('RGB')
        image.thumbnail((1100, 1100), Image.Resampling.LANCZOS)
        image.save(target, 'WEBP', quality=88, method=6)
    images.append({'type': 'fabric', 'key': key, 'file': str(target), 'filename': target.name, 'source': item['path'], 'sourceWidth': item['pixel_width'], 'sourceHeight': item['pixel_height']})

assert len(catalog) == 25
assert sum(item['type'] == 'fabric' for item in images) == 21
assert sum(item['type'] == 'accessory' for item in images) == 48
(ROOT / 'exports/full-catalog-media.json').write_text(json.dumps(images, ensure_ascii=False, indent=2) + '\n')
(ROOT / 'source-archives/accessory-specs-20261029.json').write_text(json.dumps(specs, ensure_ascii=False, indent=2) + '\n')
print(f'Catalog: {len(catalog)} items; prepared {len(images)} new images.')
print('Placement-blocked pending dimensions:', [key for key, item in catalog.items() if not item['dimensionsVerified']])
print('Reference-photo fallbacks:', sum(item.get('fallbackOriginal', False) for item in images))
