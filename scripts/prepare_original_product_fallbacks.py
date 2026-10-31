"""Prepare reference-only product crops from supplied source photos.

Used only when a verified transparent planner view could not be generated. The source image
is never overwritten; this makes a conservative center crop and removes only pixels matching
the sampled white background. Product perspective, colour, and geometry remain untouched.
"""
from pathlib import Path
from PIL import Image
import json
import statistics

PREP = Path('/home/ubuntu/myu-preparation')
manifest = json.loads((PREP / 'accessories-20261029/manifest.json').read_text())
created = []


def sample_background(image: Image.Image):
    points = [(2, 2), (image.width - 3, 2), (2, image.height - 3), (image.width - 3, image.height - 3)]
    samples = [image.getpixel(point)[:3] for point in points]
    return tuple(int(statistics.median([pixel[channel] for pixel in samples])) for channel in range(3))


def alpha_from_background(image: Image.Image, background):
    rgba = image.convert('RGBA')
    pixels = rgba.load()
    width, height = rgba.size
    # Preserve off-white metal; remove only near-identical flat source background.
    for y in range(height):
        for x in range(width):
            r, g, b, _ = pixels[x, y]
            distance = ((r - background[0]) ** 2 + (g - background[1]) ** 2 + (b - background[2]) ** 2) ** 0.5
            alpha = 0 if distance <= 7 else min(255, int((distance - 7) * 22))
            pixels[x, y] = (r, g, b, alpha)
    return rgba


for family in manifest['families']:
    directory = PREP / 'catalog-20261029' / family['id']
    spec = json.loads((directory / 'spec.json').read_text())
    image_by_finish = {item['finish']: Path(item['path']) for item in family['images']}
    for finish in ('cream', 'charcoal'):
        target = directory / f'{finish}.png'
        if target.exists():
            continue
        source = image_by_finish[finish]
        with Image.open(source) as original:
            # Product is centred; this deliberately discards outer measurement annotations and whitespace.
            left = round(original.width * 0.07)
            upper = round(original.height * 0.08)
            right = round(original.width * 0.93)
            lower = round(original.height * 0.86)
            cropped = original.convert('RGB').crop((left, upper, right, lower))
            reference = alpha_from_background(cropped, sample_background(original.convert('RGB')))
            # Keep the complete source perspective and aspect. Only reduce byte size for the app.
            reference.thumbnail((760, 760), Image.Resampling.LANCZOS)
            reference.save(target, 'PNG', optimize=True)
        spec[f'{finish}_image_path'] = str(target)
        spec.setdefault('fallback_image_notes', {})[finish] = (
            'Original supplied product photo, conservatively cropped to remove outer '
            'measurement annotations and whitespace after front-view generation was unavailable. '
            'Perspective and product geometry are unchanged; it is a reference photo, not a generated front view.'
        )
        (directory / 'spec.json').write_text(json.dumps(spec, ensure_ascii=False, indent=2) + '\n')
        created.append({'id': family['id'], 'name': family['name'], 'finish': finish, 'source': str(source), 'output': str(target)})

out = Path('/home/ubuntu/wallplay/exports/original-product-fallbacks.json')
out.write_text(json.dumps(created, ensure_ascii=False, indent=2) + '\n')
print(f'Created {len(created)} original-photo fallback references: {out}')
