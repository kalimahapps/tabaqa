import * as vscode from 'vscode';
import { SettingsMerger } from '@/settings-merger';

const activate = function (context: vscode.ExtensionContext) {
	const { workspaceFolders } = vscode.workspace;

	if (workspaceFolders === undefined) {
		return;
	}

	const { fsPath } = workspaceFolders[0].uri;
	const merger = new SettingsMerger(fsPath);
	merger.start();
};

export { activate };