# 00_codex_cloud_1

複数のプロジェクトを管理するモノレポです。各プロジェクトを専用フォルダに配置します。

## プロジェクト

- [inoreader-obsidian](./inoreader-obsidian/): Inoreaderの有料プランの要約をMarkdownとしてObsidian Vaultへ直接保存するChrome拡張。

## Chrome拡張の読み込み

`chrome://extensions` でデベロッパーモードを有効にし、「パッケージ化されていない拡張機能を読み込む」で `inoreader-obsidian/` フォルダを選択してください。

## 検証

```sh
node --check inoreader-obsidian/app.js
node --check inoreader-obsidian/background.js
node --test inoreader-obsidian/core.test.mjs
```
