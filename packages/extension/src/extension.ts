import * as vscode from "vscode";
import { WebviewKey, initLeftPanel } from "./webview";

global._globalWebview = undefined;

export async function activate(context: vscode.ExtensionContext) {
  const { disposable: webviewDisposable } = initLeftPanel(context);

  vscode.window.createWebviewPanel;
  let disposable = vscode.commands.registerCommand(
    "extension.openLeftPanel",
    () => {
      vscode.commands.executeCommand(`${WebviewKey}.focus`);
      setTimeout(() => {
        const webview = global._globalWebview as vscode.WebviewView;
        webview?.webview?.postMessage({ type: "SET_FOCUS" });
      }, 200);
    }
  );
  context.subscriptions.push(disposable);
  context.subscriptions.push(webviewDisposable);
}

export function deactivate() {}
