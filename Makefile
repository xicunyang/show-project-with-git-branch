build-extension:
	cd packages/extension-webview && pnpm build
	cd packages/extension && pnpm compile && vsce package