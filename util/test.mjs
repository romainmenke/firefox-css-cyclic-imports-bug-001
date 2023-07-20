import http from 'http';
import path from 'path';
import fs from 'fs/promises';

function html(bundle = 'native') {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Native</title>

	<style>
		@layer base {
			:where(.box) {
				width: 100px;
				height: 100px;
				background-color: red;
			}
		}
	</style>

	<link rel="stylesheet" href="style.css?bundle=${bundle}">
</head>
<body>
	<div id="box" class="box">
	</div>
</body>
</html>
`
}

export async function createTestSafe(browser, testPath) {
	try {
		const result = await createTest(browser, testPath);
		return {
			...result,
			label: testPath.slice(1).join('/'),
		}
	} catch (e) {
		return {
			label: testPath.slice(1).join('/'),
			bundlers: [],
			success: false,
			error: e,
		}
	}
}

export async function createTest(browser, testPath) {
	let requestHandlerError = null;

	const server = http.createServer(async (req, res) => {
		const parsedUrl = new URL(req.url, 'http://localhost:8080');
		const pathname = parsedUrl.pathname;
		const bundle = parsedUrl.searchParams.get('bundle');

		switch (pathname) {
			case '':
			case '/native.html':
				res.setHeader('Content-type', 'text/html');
				res.writeHead(200);
				res.end(html('native'));
				return;
			case '/style.css':
				res.setHeader('Content-type', 'text/css');
				res.writeHead(200);

				switch (bundle) {
					case 'native':
						res.end(await fs.readFile(path.join(...testPath, 'style.css'), 'utf8'));
						return;
				}

				res.end('');
				return;

			default:
				if (pathname.endsWith('.css')) {
					res.setHeader('Content-type', 'text/css');
					res.writeHead(200);
					res.end(await fs.readFile(path.join(...testPath, pathname.slice(1)), 'utf8'));
					return;
				}

				res.setHeader('Content-type', 'text/plain');
				res.writeHead(404);
				res.end('Not found');
				break;
		}
	});

	server.timeout = 100;

	let serverError = null;
	server.on('error', (e) => {
		serverError = e;
	});

	server.listen(8080);

	const page = await browser.newPage();
	await page.setCacheEnabled(false);
	
	let pageError = null;
	page.on('pageerror', (msg) => {
		pageError = new Error(msg);
	});

	let results = {
		success: false,
		bundlers: []
	}

	{
		await page.goto(`http://localhost:8080/native.html`);
		const result = await page.evaluate(async () => {
			const box = document.getElementById('box');
			const style = window.getComputedStyle(box);
			return style.backgroundColor;
		});

		results.bundlers.push({
			label: 'native',
			success: result === 'rgb(0, 128, 0)',
			result: result,
		});
	}

	await page.close();

	await server.closeAllConnections();
	await server.close();

	results.error = serverError || pageError || requestHandlerError;
	results.success = !results.error && results.bundlers.every((x => x.success === true));
	return results;
}
