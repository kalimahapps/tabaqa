import * as fs from 'node:fs';
import * as path from 'node:path';
import * as https from 'node:https';
import * as buffer from 'node:buffer';
import * as vscode from 'vscode';

type Setting = Record<string, any | Record<string, any>>;
type Tabaqa = {
	root: boolean;
	extends: string;
	settings: Setting;
};

class SettingsMerger {
	finalSettings = {} as Setting;
	tabaqaFiles = [] as string[];
	folderPath = '';

	constructor(folderPath: string) {
		this.folderPath = folderPath;

		this.start(folderPath);

		// Watch file and trigger process
		const settingsFile = '.vscode/tabaqa.json';
		const settingsPath = `${folderPath}/${settingsFile}`;

		const watcher = vscode.workspace.createFileSystemWatcher(settingsPath);
		watcher.onDidChange((event) => {
			this.start();
		});
	}

	async start(startPath = '') {
		const folderPath = startPath || this.folderPath;

		this.tabaqaFiles = [];
		this.finalSettings = {};

		// if .vscode/tabaqa.json does not exist, then look for settings in parent folders
		if (!fs.existsSync(`${folderPath}/.vscode/tabaqa.json`)) {
			await this.findUpSettings(path.dirname(folderPath));
			if (Object.keys(this.finalSettings).length === 0) {
				return false;
			}

			// Ask user if they want to apply settings found in parent folders
			const answer = await vscode.window.showInformationMessage('Tabaqa settings found in parent folders. Do you want to apply them to the workspace?', 'Yes', 'No');
			if (answer === 'Yes') {
				this.setConfigurations();
			}
			return false;
		}

		// If .vscode/tabaqa.json exists, then process it
		await this.findUpSettings(folderPath);
		this.setConfigurations();

		return new Promise((resolve) => {
			resolve(this.finalSettings);
		});
	}

	setConfigurations() {
		for (const key of Object.keys(this.finalSettings)) {
			vscode.workspace
				.getConfiguration()
				.update(
					key,
					this.finalSettings[key]
				);
		}
	}

	/**
	 * Merge target settings into source settings.
	 *
	 * This is similar to Object.assign, but also
	 * handles language specific settings.
	 *
	 * @param  {Setting} source Settings to merge into target
	 * @param  {Setting} target The destination settings
	 * @return {Setting}        source with target merged in
	 */
	mergeSettings(source: Setting, target: Setting): Setting {
		for (const key of Object.keys(target)) {
			// ignore language specific settings
			// e.g. "[javascript]": { "editor.formatOnSave": true }
			const isLanguageSpecific = /^\[.*\]$/u.test(key);
			const doesKeyExist = source[key] !== undefined;
			if (!isLanguageSpecific && !doesKeyExist) {
				source[key] = target[key];
			}
		}

		// Handle language specific settings,
		// e.g. "[javascript]": { "editor.formatOnSave": true }
		const languageSpecific = Object.keys(target).filter((key) => {
			return /^\[.*\]$/u.test(key);
		});

		// Write to final settings
		for (const key of languageSpecific) {
			const languageSettings = target[key];

			// Loop through language settings and check if they have been already added
			Object.keys(languageSettings).forEach((languageSettingKey: string) => {
				source[key] = source[key] || {};

				const doesLangSettingExist =
					source[key][languageSettingKey] !== undefined;

				// Language setting is not already added, then add it
				if (!doesLangSettingExist) {
					source[key][languageSettingKey] =
						languageSettings[languageSettingKey];
				}
			});
		}

		return source;
	}

	extendSettingsFromUrl(extendFrom: string, settings: Setting): Promise<Setting> {
		return new Promise((resolve, reject) => {
			// Fetch settings from url
			https.get(extendFrom, (response) => {
				const data: string[] = [];
				response.on('data', (chunk) => {
					const bufferData = buffer.Buffer.from(chunk).toString();
					data.push(bufferData);
				});

				response.on('end', () => {
					try {
						const fetchedSettings = JSON.parse(data.join(''));
						const updatedSettings = this.mergeSettings(settings, fetchedSettings);
						resolve(updatedSettings);
					} catch (error) {
						vscode.window.showErrorMessage('Error while parsing fetched settings');
						console.log(error);
						reject(error);
					}
				});

				response.on('error', (error) => {
					console.error(error);
				});
			});
		});
	}

	extendSettingsFromPath(
		extendFrom: string,
		basePath: string,
		settings: Setting
	): Setting | false {
		const ignoredStrings = ['./settings.json', 'settings.json'];
		const isIgnored = ignoredStrings.includes(extendFrom);

		if (isIgnored) {
			vscode.window.showErrorMessage(`Extends can not be ${extendFrom}`);
			return false;
		}

		// Determine if extendFrom is a relative path or not
		const isRelativePath = path.isAbsolute(extendFrom);

		// If relative path, then make it absolute
		const extendFromPath = isRelativePath
			? extendFrom
			: path.resolve(basePath, extendFrom);

		// Check file exists
		if (!fs.existsSync(extendFromPath)) {
			vscode.window.showErrorMessage(`File ${extendFromPath} does not exist`);
			return false;
		}

		let mergedSettings = {} as Setting;

		// Readfile and parse json
		const fileContent = fs.readFileSync(extendFromPath, 'utf8');
		try {
			const extendFromSettings = JSON.parse(fileContent);
			mergedSettings = this.mergeSettings(settings, extendFromSettings);
		} catch (error) {
			console.log(error);
			vscode.window.showErrorMessage(`Error while parsing ${extendFromPath}`);
		}

		return mergedSettings;
	}

	async processTabaqaFile(settingsPath: string, folderPath: string) {
		this.tabaqaFiles.push(settingsPath);

		const tabaqaFile = fs.readFileSync(settingsPath);
		const tabaqa: Tabaqa = JSON.parse(tabaqaFile.toString());
		const {
			settings: workspaceSettings = {},
			root,
			extends: extendFrom,
		} = tabaqa;

		if (extendFrom === undefined) {
			this.finalSettings = this.mergeSettings(this.finalSettings, workspaceSettings);

			return root;
		}

		if (!extendFrom.endsWith('.json')) {
			vscode.window.showErrorMessage('Extends must be a json file');
			return root;
		}

		if (extendFrom.startsWith('http')) {
			const updatedSettings = await this.extendSettingsFromUrl(extendFrom, workspaceSettings);
			this.finalSettings = this.mergeSettings(this.finalSettings, updatedSettings);
			return root;
		}

		const pathSettings = this.extendSettingsFromPath(extendFrom.replaceAll('\\', '/'), `${folderPath}/.vscode`, workspaceSettings);
		if (pathSettings) {
			this.finalSettings = this.mergeSettings(this.finalSettings, pathSettings);
			return root;
		}

		this.finalSettings = this.mergeSettings(this.finalSettings, workspaceSettings);

		return root;
	}

	/**
	 * Find tabaqa.json files up the folder tree recursively
	 * The function stops when it reaches the root folder or
	 * when it finds a tabaqa.json file with `root` set to true
	 *
	 * @param {string} folderPath Path to folder to start looking for tabaqa.json files
	 */
	async findUpSettings(folderPath: string) {
		const settingsFile = '.vscode/tabaqa.json';
		const settingsPath = `${folderPath}/${settingsFile}`;

		if (fs.existsSync(settingsPath)) {
			const isRoot = await this.processTabaqaFile(settingsPath, folderPath);

			// If current tabaqa.json is root, then stop
			if (isRoot) {
				return;
			}
		}

		const parent = path.dirname(folderPath);
		if (parent === folderPath) {
			return;
		}

		await this.findUpSettings(parent);
	}
}

export { SettingsMerger };