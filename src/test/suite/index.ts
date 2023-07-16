import * as path from 'node:path';
import Mocha from 'mocha';
import { glob } from 'glob';

const run = (): Promise<void> => {
	const testsRoot = path.resolve(__dirname, '..');

	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
		color: true,
	});

	mocha.timeout(20_000);

	return new Promise((resolve, reject) => {
		const files = glob.sync('**/**.test.js', {
			cwd: testsRoot,
			absolute: true,
		});

		// Add files to the test suite
		files.forEach((file) => {
			return mocha.addFile(path.resolve(testsRoot, file));
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

export { run };