# Repro

steps :
- read contents of `package.json`
- run `npm run install:with-firefox`
- run `npm run test.mjs`

This will :
- setup puppeteer with Firefox.
- run the tests found under `./tests/cycles`.

The tests will always see a red box.

## Manual checks :

Each folder also contains an `index.html` file.  
You can open this in any browser.

The box will always be green.
