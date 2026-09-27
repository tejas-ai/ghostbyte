"""Generate reviewed-at-build-time translation catalogs from public UI copy.

Run i18n-extract.mjs first. The app uses the generated JSON locally and makes
no translation-service requests at runtime. This script is a maintenance tool;
its public endpoint can be replaced without changing the shipped application.
"""
import concurrent.futures
import json
import http.client
import pathlib
import re
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCES = json.loads((ROOT / 'i18n' / 'source.json').read_text(encoding='utf-8'))
TARGETS = {
    'Hindi': 'hi', 'Kannada': 'kn', 'Spanish': 'es', 'French': 'fr',
    'Tamil': 'ta', 'Telugu': 'te', 'Marathi': 'mr', 'Bengali': 'bn',
    'Gujarati': 'gu', 'Malayalam': 'ml',
}
REVIEWED_OVERRIDES = {
    'Tamil': {
        'ECDH P-256 Keypairs, Contact Keys & NIST CAVP Self-Tests':
            'ECDH P-256 விசை ஜோடிகள், தொடர்பு விசைகள் மற்றும் NIST CAVP சுயப் பரிசோதனைகள்',
        'Video Guided Walkthroughs': 'காணொளி வழிகாட்டிகள்',
    },
}
BATCH = 16
MARKER = re.compile(r'⌁(\d{3})⌁')


def request(batch, code):
    body = '\n'.join(f'⌁{i:03d}⌁ {phrase}' for i, phrase in enumerate(batch))
    url = 'https://translate.googleapis.com/translate_a/single?' + urllib.parse.urlencode({
        'client': 'gtx', 'sl': 'en', 'tl': code, 'dt': 't', 'q': body,
    })
    for attempt in range(5):
        try:
            with urllib.request.urlopen(url, timeout=30) as response:
                translated = ''.join(row[0] for row in json.load(response)[0] if row[0])
            parts = MARKER.split(translated)
            if len(parts) < len(batch) * 2 + 1:
                raise ValueError(f'markers lost: {len(parts)} for {len(batch)} strings')
            found = {}
            for i in range(1, len(parts) - 1, 2):
                found[int(parts[i])] = parts[i + 1].strip()
            if any(not found.get(i) for i in range(len(batch))):
                raise ValueError('missing translated phrase')
            return dict(zip(batch, (found[i] for i in range(len(batch)))))
        except (ValueError, IndexError):
            if len(batch) > 1:
                midpoint = len(batch) // 2
                return request(batch[:midpoint], code) | request(batch[midpoint:], code)
            # Single phrases do not need an item marker; a translator may drop
            # the marker for short fragments such as "or".
            plain_url = 'https://translate.googleapis.com/translate_a/single?' + urllib.parse.urlencode({
                'client': 'gtx', 'sl': 'en', 'tl': code, 'dt': 't', 'q': batch[0],
            })
            with urllib.request.urlopen(plain_url, timeout=30) as response:
                result = ''.join(row[0] for row in json.load(response)[0] if row[0]).strip()
            return {batch[0]: result}
        except (urllib.error.URLError, TimeoutError, http.client.HTTPException, OSError) as error:
            if attempt == 4:
                raise RuntimeError(f'{code}: {error}') from error
            time.sleep(2 ** attempt)


def generate(name, code):
    output = ROOT / 'i18n' / f'{name}.json'
    saved = json.loads(output.read_text(encoding='utf-8')) if output.exists() else {}
    pending = [phrase for phrase in SOURCES if phrase not in saved]
    batches = [pending[i:i + BATCH] for i in range(0, len(pending), BATCH)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(request, batch, code): batch for batch in batches}
        for index, future in enumerate(concurrent.futures.as_completed(futures), 1):
            saved.update(future.result())
            if index % 10 == 0 or index == len(batches):
                output.write_text(json.dumps(saved, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
                print(f'{name}: {len(saved)}/{len(SOURCES)}', flush=True)
    # Batched services occasionally append the next item after a newline.
    # Source phrases are normalized to one line, so only the first line is valid.
    saved = {phrase: saved[phrase].splitlines()[0].strip() for phrase in SOURCES}
    saved.update({phrase: value for phrase, value in REVIEWED_OVERRIDES.get(name, {}).items() if phrase in saved})
    output.write_text(json.dumps(saved, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return name, len(saved)


if __name__ == '__main__':
    # Language jobs are serialized to avoid overwhelming the public service.
    for language, target in TARGETS.items():
        print(generate(language, target), flush=True)
