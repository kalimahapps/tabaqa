import { checkSettingsFile } from '@/test/helper';

suite('Extension Test Suite', () => {
	test('Test level 3 with http base', async () => {
		// Check first level
		await checkSettingsFile('level-3-settings.json');
	});
});
