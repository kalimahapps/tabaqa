import * as path from 'node:path';
import { runTests, runVSCodeCommand } from '@vscode/test-electron';

const posixPath = (path: string) => {
	return path.replaceAll('\\', '/');
};

const main = async function () {
	let testRoot = path.resolve(__dirname, '..', '..', 'src', 'test');
	testRoot = posixPath(testRoot);

	/**
	 * VSCode instance will restart infinitely if we attempt to open
	 * a folder from within unit test. So we need to open
	 * a folder from outside the unit test.
	 *
	 * @see https://github.com/microsoft/vscode/issues/143273
	 */
	const folders: Record<string, string> = {
		'level0': posixPath(path.resolve(testRoot, 'sample')),
		'level1': posixPath(path.resolve(testRoot, 'sample', 'level1')),
		'level2': path.resolve(testRoot, 'sample', 'level1', 'level2'),
		'level2-1': path.resolve(testRoot, 'sample', 'level1', 'level2-1'),
		'level3': path.resolve(testRoot, 'sample', 'level1', 'level2', 'level3'),
	};

	try {
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		await Object.keys(folders).reduce(async (previousPromise, folder) => {
			await previousPromise;
			const extensionTestsPath = posixPath(path.resolve(__dirname, 'suite', folder, 'index.js'));

			/**
			 * Install extensions
			 */
			await runVSCodeCommand(['--install-extension', 'streetsidesoftware.code-spell-checker']);
			await runVSCodeCommand(['--install-extension', 'dbaeumer.vscode-eslint']);
			await runVSCodeCommand(['--install-extension', 'bradlc.vscode-tailwindcss']);
			await runVSCodeCommand(['--install-extension', 'eamodio.gitlens']);

			// open workspace
			const workspacePath = folders[folder];
			const launchArguments = [workspacePath];

			// Download VS Code, unzip it and run the integration test
			await runTests({
				extensionDevelopmentPath,
				extensionTestsPath,
				launchArgs: launchArguments,
			});
		}, Promise.resolve());
	} catch (error) {
		console.error('Failed to run tests', error);
		process.exit(1);
	}
};

main();
