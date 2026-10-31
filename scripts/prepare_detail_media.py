from pathlib import Path
import json
from PIL import Image

ROOT = Path('/home/ubuntu/wallplay')
OUT = ROOT / 'client/public/content'
SOURCE = OUT / 'source'
source = SOURCE / 'detail-01.webp'
with Image.open(source) as image:
    count = image.n_frames
    loop = image.info.get('loop', 0)
    frames, durations = [], []
    for index in range(count):
        image.seek(index)
        image.load()
        durations.append(image.info['duration'])
        frame = image.convert('RGB')
        frame.thumbnail((960, 600))
        frames.append(frame)
    frames[0].save(OUT / 'installation-demo.webp', save_all=True,
                   append_images=frames[1:], duration=durations, loop=loop,
                   quality=82, method=4)
with Image.open(OUT / 'installation-demo.webp') as image:
    output_durations = []
    for index in range(image.n_frames):
        image.seek(index)
        image.load()
        output_durations.append(image.info['duration'])
    assert image.n_frames > 1
    assert sum(output_durations) == sum(durations)
    print(f'Animation: {image.n_frames} frames, {sum(output_durations)}ms, {(OUT / "installation-demo.webp").stat().st_size} bytes', flush=True)

# Only remove the original shop's LINE/returns/warranty contact strip.
# Heading, all three suitability columns and the safety warning are preserved.
with Image.open(SOURCE / 'detail-08.webp') as image:
    image.crop((0, 0, image.width, 336)).save(OUT / 'wall-surfaces.webp', quality=94)
for index, name in [(7, 'product-comparison.webp'), (9, 'questions-install.webp')]:
    (OUT / name).write_bytes((SOURCE / f'detail-{index:02d}.webp').read_bytes())
with Image.open(SOURCE / 'detail-10.webp') as image:
    image.crop((0, 0, image.width, 372)).save(OUT / 'questions-use.webp', quality=94)

note = {
    'page': 'https://www.themyumyu.com/pages/magnetic-storage',
    'included': [1, 7, 8, 9, 10],
    'excluded': {
        '0': 'Use the user supplied full hero instead of repeating it.',
        '2': 'User explicitly excludes this introductory bundle purchase card.',
        '3-6': 'Duplicate series selection raster panels; use existing functional six-entry UI.',
        '11-14': 'Original shop promotional/category and customization navigation, not new product details.'
    },
    'edits': {'1': 'Responsive re-encoding; animation duration and loop preserved.',
              '8': 'Crop bottom LINE contact/returns strip; all suitability content and caution preserved.',
              '10': 'Crop only the original store seven-day returns FAQ; four product usage answers preserved.'}
}
(ROOT / 'design-references/detail-media-selection.json').write_text(json.dumps(note, ensure_ascii=False, indent=2) + '\n')
print('Five genuine product detail assets prepared.', flush=True)
