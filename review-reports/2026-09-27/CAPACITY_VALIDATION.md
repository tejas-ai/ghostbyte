# Full carrier capacity validation

Date: 2026-09-27

- Simple mode now exposes all four supported embedding densities and preserves the selected density when opening Pro.
- A 10417 x 6668 carrier has 49.68 MiB capacity at Balanced and 149.05 MiB at Maximum capacity, before payload framing and encryption overhead. Capacity is derived from pixels, not the image file's compressed size.
- Removed the fixed 30 MiB individual and 50 MiB combined secret-file limits in both workbenches. Payloads still must fit the carrier and the device must have sufficient memory.
- File reading blocks encoding until all selected files finish loading.
- `npm test`: 33 tests passed, including exact-capacity round trips for every density and the reported image dimensions.
- `npm run build:verify`: passed type checking, production build, and artifact manifest verification.
- Browser regression: loaded a 128.04 MiB BMP at 8193 x 5462, selected a 60 MiB payload, confirmed Balanced rejected it for insufficient room, then selected Maximum capacity (96.02 MiB).
- Encrypted and exported the payload successfully. The exported PNG retained 8193 x 5462 resolution. Re-importing that PNG and decrypting showed `Payload Successfully Extracted`, the original filename, and 60.00 MB. Successful AES-GCM decryption verifies the encrypted payload's authentication tag.
- The in-app browser did not expose/save the recovered binary download during automation, so an independent downloaded-file SHA-256 comparison was not completed. Chrome automation was unavailable because its request-header policy failed to load.
- Large synthetic fixtures and local screenshots are intentionally excluded from Git.
