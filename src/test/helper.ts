import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import Mocha from 'mocha';
import { glob } from 'glob';
import { SettingsMerger } from '@/settings-merger';

// This point to test root in typescript
const testRoot = path.resolve(__dirname, '..', '..', 'src', 'test');

const watchChanges = function (path: string) {
	return new Promise((resolve) => {
		const watcher = vscode.workspace.createFileSystemWatcher(path);

		// Debounce the event
		let timer: NodeJS.Timeout;
		watcher.onDidChange((event) => {
			clearTimeout(timer);
			timer = setTimeout(() => {
				// Kill watcher
				watcher.dispose();
				resolve(event.fsPath);
			}, 300);
		});
	});
};

const wait = function (ms: number) {
	return new Promise((resolve) => {
		return setTimeout(resolve, ms);
	});
};

const posixPath = (path: string) => {
	return path.replaceAll('\\', '/');
};

const checkSettingsFile = async (fixtureFile: string) => {
	const { workspaceFolders } = vscode.workspace;
	if (workspaceFolders === undefined) {
		throw new Error('No workspace folder found');
	}

	let { fsPath } = workspaceFolders[0].uri;
	fsPath = posixPath(fsPath);

	const settingsPath = `${fsPath}/.vscode/settings.json`;

	// Make sure settings.json is deleted
	if (fs.existsSync(settingsPath)) {
		fs.unlinkSync(settingsPath);
	}

	const merger = new SettingsMerger(fsPath);
	await merger.start();

	try {
		// wait for settings.json to be complete changes
		await watchChanges(settingsPath);
		let settingsContent = fs.readFileSync(settingsPath, 'utf8');
		settingsContent = JSON.parse(settingsContent);

		// Get fixture
		let fixturePath = path.resolve(testRoot, 'fixtures', fixtureFile);
		fixturePath = posixPath(fixturePath);

		let fixtureContent = fs.readFileSync(fixturePath, 'utf8');
		fixtureContent = JSON.parse(fixtureContent);

		// Compare
		assert.deepStrictEqual(settingsContent, fixtureContent);
	} catch (error) {
		console.log('\n\n ---- ERROR ----');
		console.log('Path', settingsPath);
		console.log(error);
	}

	// delete settings.json
	fs.unlinkSync(settingsPath);

	return true;
};

const runMocha = (testsPath: string): Promise<void> => {
	const testsRoot = path.resolve(__dirname);

	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
		color: true,
	});

	mocha.timeout(20_000);
	return new Promise((resolve, reject) => {
		const files = glob.sync('**/**.test.js', {
			cwd: posixPath(path.resolve(testsRoot, 'suite', testsPath)),
			absolute: true,
		});

		// Add files to the test suite
		files.forEach((file) => {
			return mocha.addFile(path.resolve(testsRoot, testsPath, file));
		});

		try {
			// Run the mocha test
			mocha.run((failures) => {
				if (failures > 0) {
					return reject(new Error(`${failures} tests failed.`));
				}

				return resolve();
			});
		} catch (error) {
			console.error(error);
			reject(error);
		}
	});
};

export {
	checkSettingsFile,
	posixPath,
	runMocha
};