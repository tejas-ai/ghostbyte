# QuietSend functional fixes and validation

Date: 27 September 2026

The critical functional defects reproduced during this review have been fixed locally. The changes cover image and audio workflows, recipient-key decryption, archive downloads, draft transfer, mobile navigation, and offline loading. No deployment was performed.

## Fixed defects

| Area | Before | Fixed behavior |
| --- | --- | --- |
| Recipient-key image decryption | Decoder omitted the selected private key when calling the image engine. | The selected key is passed through to the image decryption path. |
| Honey-Vault → ECDH switching | A stale dual-vault flag could select passphrase encryption despite the selected recipient-key mode. | Security-mode changes clear incompatible vault state; the encode branch checks the selected protocol. |
| Audio decoy option | The interface offered a dual vault that audio encoding ignored. | The option is restricted to supported image/passphrase workflows and cleared on switching to audio. |
| Transparent PNGs | Encoding succeeded, but canvas alpha conversion corrupted the saved payload. | Transparency is composited onto white before embedding. The UI describes this output behavior. |
| TIFF import | JPEG conversion and 1920-pixel downscaling damaged hidden bits and misreported capacity. | TIFF import preserves full-resolution pixels using PNG, with dimension checks before decompression. |
| Plaintext density probing | NUL-heavy garbage could be accepted as text before the correct density was tried. | Text plausibility checks reject control-heavy streams and preserve supplementary Unicode characters. |
| Malformed bitstream headers | Signed integer conversion could produce negative allocation lengths. | The complete header is converted to an unsigned length before capacity validation. |
| Unicode filenames | Encoder output could exceed the decoder's UTF-8 filename bound. | Sanitization enforces both code-point and UTF-8 byte limits. |
| GhostVault bounds | More than 500 files or a truncated archive could return a partial file list. | Oversized collections are rejected before encoding; malformed archives return raw binary instead of a partial vault. |
| Download All Files | Only the first file was downloaded with a ZIP extension. | The action generates a real multi-entry ZIP with CRCs and a central directory. |
| Keyring/contact updates | Open workbenches did not refresh after changes in Keyring Studio. | Storage updates notify consumers immediately, preserving valid selections. |
| Simple → Pro handoff | The upgrade action discarded the current draft. | It transfers the carrier, text/files, and passphrase. Pro owns a separate carrier URL so a Simple reset cannot revoke it. |
| Mode changes | Workbenches were unmounted and lost their current state. | Both mode workbenches remain mounted; inactive paste listeners are disabled. Navigating between tool tabs still resets those tool components. |
| Image comparator | Replacing an image left old statistics and visualizations visible; old async jobs could restore stale results. | Replacement clears the analysis and invalidates pending jobs. |
| Authentication status | Plaintext extraction claimed AES-GCM authentication. | The result distinguishes authenticated decryption from unauthenticated extraction. |
| Mobile navigation | Header controls overflowed a narrow viewport. | Navigation wraps into its own row and secondary shortcuts are hidden on small screens. |
| Tutorial and blog controls | Missing tutorial media had no useful fallback; article cards were not keyboard buttons. | Media failures show a written-guide fallback; article cards use native buttons. |
| Offline loading | The shell lacked precached application assets; Vary: Origin caused first offline module requests to miss cache entries. | Builds inject all application assets into the precache. Static asset matches tolerate Origin variation, and registration/activation lifetimes are handled explicitly. |

Deployment instructions were also corrected for secure-origin requirements, Node compatibility, and the build manifest's actual behavior.

## Validation completed

- `npm test`: **26 tests passed** across cryptographic self-tests, mobile/data regressions, and the service-worker regression.
- `npm run typecheck`: passed.
- `npm run build:verify`: passed; production output and `dist/SHA256SUMS` generated. This command calculates hashes; it does not independently compare against a trusted release.
- `git diff --check`: passed; Git reported only existing line-ending notices.
- **14 real-browser service cases passed**: opaque and transparent PNGs (alpha 0 and 128), plaintext density detection, TIFF conversion, full-resolution TIFF extraction above 1920 pixels, UTF-8 filenames, oversized archive rejection, emoji text at all four densities, and recipient-key image encryption/decryption.
- Production UI handoff transferred a 60,000-character message and its carrier. Removing the Simple carrier left Pro's independent copy usable, and encoding from that copy succeeded.
- Mobile layout checked at 390px: page width remained within the viewport.
- Fresh-origin production test: loaded the site once, stopped the preview server, and successfully reloaded the app offline after the cache-matching fix.

Browser fixture code and outputs are retained under `review-reports/`. Screenshots include `production-result.png`, `mobile-fixed.png`, and `offline-reload.png`.

## Boundaries

These checks used synthetic local files and generated test keys. They do not constitute a formal cryptographic audit or real-device Safari/Android testing. Transparent output is intentionally opaque; previously corrupted carriers cannot be repaired by these changes. Tutorial videos remain dependent on the media included with each deployment. Existing unrelated workspace edits were preserved.
