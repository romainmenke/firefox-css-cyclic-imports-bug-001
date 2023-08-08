# Repro

## Structure

`./test.mjs` is the main driver:
- starts a browser instance through puppeteer
- lists folders with tests
- collects results

`./util/test.mjs` is a helper to run a single test:
- start a dev server
- visit a page
- check if expectations are met

`./tests/cycles` contains test resources.

## Steps

### With puppeteer

- read contents of `package.json`
- run `npm run install:with-firefox`
- run `npm run test.mjs`

this will :
- setup puppeteer with Firefox.
- run the tests found under `./tests/cycles`.

The tests will always show a red box.

### With a web server

- read contents of `package.json`
- run `npm run serve`
- visit `http://127.0.0.1:8080/tests/cycles/006/` (or whatever port was assigned)

The tests will always show a red box.

### As a file

Each folder also contains an `index.html` file.  
You can open this in any browser.

The box will always be green.
