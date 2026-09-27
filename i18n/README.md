# Interface translations

The app ships static catalogs for Hindi, Kannada, Spanish, French, Tamil, Telugu,
Marathi, Bengali, Gujarati, and Malayalam. Translation happens in the browser
without sending user content to a translation service. `data-no-translate`
protects user-authored messages and filenames from interface translation.

When interface copy changes, run `node scripts/i18n-extract.mjs`, then
`python scripts/i18n-generate.py`, review the changed translations in context,
and run `npm test && npm run build:verify`. The generation script uses an
external machine-translation endpoint only for public, source-authored UI copy;
it is a maintenance aid and its output needs human proofreading before release.
