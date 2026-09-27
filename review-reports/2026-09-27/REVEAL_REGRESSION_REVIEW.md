# Reveal and related workflow review

Date: 2026-09-27

## Confirmed cause and fixes

- Simple Reveal substituted the first saved ECDH private key for an empty passphrase. The image decoder then attempted AES decryption even for plaintext carriers. Passphrases and saved private keys now travel separately; saved keys are tried only for an asymmetric envelope.
- Image and WAV extraction share the same credential routing. Simple mode tries every saved identity, allowing a recipient key that is not the first entry to work.
- Recognized plaintext remains readable when a leftover password is entered. Pro only shows authentication after a successful cryptographic authentication check, rather than merely because an input field contains a secret.
- Unknown binary streams are no longer described as definitely encrypted. Public-key errors retain the instruction to use the matching private key.
- Editing carrier, payload, password, density, or recipient invalidates the previous export. Results completed after inputs change are discarded, preventing downloads from silently using old settings.
- Navigation may wrap at intermediate screen widths. Clipboard failures are surfaced, and leaving a Reveal screen aborts its extraction flow.
- File frames with trailing unaccounted bytes are no longer accepted as valid embedded files.

## Validation

- 45 automated tests passed, including a React regression for the exact empty-passphrase plus saved-Keyring bug, all four image densities, plaintext files/archives, AES wrong-password and tamper rejection, multiple ECDH identities, cancellation, and both dual-vault passwords.
- The production build, TypeScript checks, and build artifact verification passed.
- The carrier identified in the user's screenshot was loaded locally with a saved Keyring. It successfully extracted with the passphrase left empty, without an alert. Its contents and the carrier itself are excluded from this report and Git.
- Browser check: changing a password after encoding removed the old download link. A fresh plaintext encode then succeeded.
- The tested intermediate browser layout had no horizontal overflow. Requested viewport overrides were not reflected in the browser's measured viewport, so those requests are not counted as separate mobile-device validations.
- Automated PNG/binary downloads through the in-app browser timed out during this session. Export and extraction were exercised, but a new downloaded-file hash comparison was not completed.

This is a review of the identified workflows, not a guarantee that every browser, device, or possible input is defect-free.
