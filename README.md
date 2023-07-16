<h1 align="center">Tabaqa</h1>
<p align="center">
Extendand and nested settings for VSCode
</p>
<br>
<p align="center">
<a target="_blank" href="https://www.npmjs.com/package/@kalimahapps/eslint-config">
  <img src="https://img.shields.io/badge/ESLint%20Config-kalimahapps-blue?style=flat-square"></a>
<a target="_blank" href="https://marketplace.visualstudio.com/items?itemName=KalimahApps.tabaqa">
  <img src="https://img.shields.io/visual-studio-marketplace/v/KalimahApps.tabaqa?style=flat-square"></a>
  <a target="_blank" href="https://marketplace.visualstudio.com/items?itemName=KalimahApps.tabaqa">
  <img src="https://img.shields.io/visual-studio-marketplace/d/KalimahApps.tabaqa?style=flat-square&logo=visualstudiocode&logoColor=%23fff&label=downloads&labelColor=%232588cf"></a>
</p>
<p align="center">
<a target=_blank href="https://twitter.com/KalimahApps">
  <img src="https://img.shields.io/twitter/follow/KalimahApps?style=for-the-badge">
</a>
</p>

<br>

> **_NOTE:_**  Please be aware that this extension updates settings.json file. If you have any custom settings, please make sure to backup your settings.json file before installing this extension.

<br>

Extend VSCode settings from a parent folder, another file or a url. You can also nest settings by adding a `tabaqa.json` file inside a folder. The extension will look for the file and apply the settings to the current workspace.

<br>

### How does it work?
The extension looks for a file names `tabaqa.json` inside the top level `.vscode` folder. If the file is found, it will read the file and apply the settings to the current workspace. The extension will inherit the settings from all `tabaqa.json` files up the folder tree until it reaches the root folder (or if `root: true` has been set).

See this folder structure as an example:
```
├── .vscode
│   └─ tabaqa.json
├── folder-1
│   ├─ .vscode
│   │   └─ tabaqa.json
│   └─ folder-2
│       ├─ .vscode
│       │   └─ tabaqa.json
│       └─ folder-3
│           └─ .vscode
│               └─ tabaqa.json
```

If `folder-3` is opened in VSCode, the extension will look for `tabaqa.json` in `folder-3` then `folder-2` then `folder-1` (if `root: true` is not set in any of them). Settings will be merged and then applied to the `folder-3` workspace.

<br>
<br>

### tabaqa.json structure
> Note: schmea is provided through the extension. You can use `Ctrl + Space` to get suggestions. `settings` property have the same schema as VSCode settings.

The `tabaqa.json` file should be a json object with the following properties (all properties are optional):
```json
{
  "extends": "path/to/json-file.json", 
  "root": true,
  "settings": {
	"editor.formatOnSave": true
	...
  }
}
```

- `extends`:
You can set it to a path on desk or url that points to a json that contains VSCode extension to extend from. Settings parsed from this fill will be merged with `settings` property.

- `root`:
If set to true, the extension will stop looking for parent tabaqa.json files.

- `settings`:
You can set it to an object that contains VSCode settings to apply to the current workspace. Settings added here will have the highest priority. It overrides parent settings or extended settings.