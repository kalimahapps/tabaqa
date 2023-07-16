import { checkSettingsFile } from '@/test/helper';

suite('Extension Test Suite', () => {
	test('Test level 1', async () => {
		// Check first level
		await checkSettingsFile('level-1-settings.json');
	});
});
