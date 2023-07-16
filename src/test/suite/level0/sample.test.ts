import { checkSettingsFile } from '@/test/helper';

suite('Extension Test Suite', () => {
	test('Test top level', async () => {
		await checkSettingsFile('level-0-settings.json');
	});
});
