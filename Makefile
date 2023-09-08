build:
	# pnpm run tsup-build-server
	# pnpm run build-client
	# rm -rf packages/server/client
	# cp -r packages/client/dist packages/server/client

build-extension:
	cd packages/extension-webview && pnpm build
	cd packages/extension && pnpm compile && vsce package