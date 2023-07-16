import * as assert from 'node:assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should be present', () => {
		assert.ok(vscode.extensions.getExtension('KalimahApps.tabaqa'));
	});

	test('should activate', async function () {
		// activate() function will resolve when the extension is activated.
		await vscode.extensions.getExtension('KalimahApps.tabaqa')?.activate();
		assert.ok(true);
	});
});
