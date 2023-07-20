import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";

const { createTestSafe } = await import('./util/test.mjs')

const firefox = await puppeteer.launch({
	headless: 'new',
	product: 'firefox', // Comment this out to run with Chrome
});

const testCases = (await fs.readdir('./tests', { withFileTypes: true, recursive: true })).filter(dirent => {
	return dirent.isFile() && dirent.name === 'style.css'
}).map(dirent => {
	return path.relative('tests', dirent.path);
})

testCases.sort();

const results = [];

for (const testCase of testCases) {
	results.push(
		await createTestSafe(firefox, ['tests', ...testCase.split(path.sep)])
	);
}

let failureCount = 0;
let nativeFailureCount = 0;
for (const result of results) {
	if (result.success === false) {
		failureCount++;

		if (!result.bundlers.find((x => x.label === 'native')).success) {
			nativeFailureCount++;
		}

		console.error(`FAIL - ${result.label}`)
		console.table(result.bundlers)

		if (process.env.DEBUG) {
			console.error(result.error);
		}

		continue;
	}
	
	console.log(`OK   - ${result.label}`)
}

await firefox.close()

if (failureCount > 0) {
	console.error(`${nativeFailureCount} / ${testCases.length} test(s) failed in an actual browser.`);
	process.exit(1);
}
