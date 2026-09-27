# Image upload limit removal

Removed application-defined carrier byte, dimension, and megapixel caps across Simple Hide, Pro Hide, both Reveal modes, and Inspect. Carrier images are not resized automatically. Browser decoding, canvas support, and device memory determine what can be processed.

Image decode errors now explain possible format/memory problems. Canvas allocation failures reject encoding instead of leaving it pending; ImageBitmap resources are released even when drawing fails. Inspect displays image load failures instead of silently swallowing them. TIFF dimensions are still validated for valid positive integers before decoding.

## Verification

- `npm test`: 28 passing tests, including six upload regressions (large file metadata, original dimensions, mobile behavior, invalid dimensions, decode failure, and unavailable canvas allocation).
- `npm run build:verify`: typecheck, production build, and build manifest generation passed.
- Real browser, Simple Hide: a synthetic **134,256,014-byte BMP (128.04 MiB), 8193 × 5462 pixels**, loaded successfully.
- Encrypted a demo message and downloaded the resulting PNG. The browser reported output dimensions of **8193 × 5462**, confirming no resizing.
- Simple Reveal recovered the exact encrypted demo message from that exported PNG with the matching passphrase.

The large synthetic BMP is kept locally for testing, not committed. These results establish operation on the test browser; they do not claim infinite browser memory or certify all device-specific image limits. WAV carrier limits and embedded secret-file archive limits are separate and unchanged.
