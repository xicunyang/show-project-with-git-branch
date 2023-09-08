import * as vscode from "vscode";
import { WebviewView } from "vscode";
const childProcess = require("child_process");

export const WebviewKey = "show-project-with-git-branch-panel-view";

const getCurrentGitBranchName = (path: string) => {
  let destPath = "";
  try {
    destPath = childProcess
      .execSync(`cd ${path} && git rev-parse --abbrev-ref HEAD`)
      .toString();
  } catch (e) {
    // console.log("出错啦:", e);
  }
  return destPath;
};

const openProject = (path: string) => {
  let destPath = "";
  try {
    destPath = childProcess.execSync(`code ${path}`).toString();
  } catch (e) {
    // console.log("出错啦:", e);
  }
  return destPath;
};

const getFreshFolderItems = async () => {
  const recentlyOpened: any = await vscode.commands.executeCommand<
    vscode.Location[]
  >("_workbench.getRecentlyOpened");

  const workspaces = recentlyOpened.workspaces as any[];

  const formatFolderItems = workspaces.map((workspace) => {
    const originPath: string = workspace?.folderUri?.path || "";
    const originPathArr = originPath.split("/");
    const name = originPathArr.pop();
    const branchName = getCurrentGitBranchName(originPath).replace("\n", "");

    return {
      name,
      path: workspace?.folderUri?.path || "",
      branchName,
    };
  });

  return formatFolderItems;
};

const getWebview = (webviewView: WebviewView, context) => {
  // js文件
  const scriptPath = vscode.Uri.joinPath(
    context.extensionUri,
    "media",
    "main.js"
  );

  const scriptUri = webviewView.webview.asWebviewUri(scriptPath);

  webviewView.webview.options = {
    enableScripts: true,
  };

  const postFreshItems = async () => {
    webviewView.webview.postMessage({
      type: "SEND_LOADING",
    });

    let freshItems = [];
    try {
      freshItems = await getFreshFolderItems();
    } catch (e) {}
    webviewView.webview.postMessage({
      type: "SEND_FRESH_PROJECT_WITH_GIT_BRANCH",
      items: freshItems,
    });
    webviewView.webview.postMessage({
      type: "SET_FOCUS",
    });
  };

  webviewView.onDidChangeVisibility((e) => {
    if (webviewView.visible) {
      postFreshItems();
    }
  });

  webviewView.webview.onDidReceiveMessage(async (message) => {
    if (message.type === "GET_FRESH_PROJECT_WITH_GIT_BRANCH") {
      const freshItems = await getFreshFolderItems();
      webviewView.webview.postMessage({
        type: "SEND_FRESH_PROJECT_WITH_GIT_BRANCH",
        items: freshItems,
      });
    }
    if (message.type === "OPEN_PROJECT") {
      const { path } = message;
      if (path) {
        openProject(path);
      }
    }
  });

  // html模板
  webviewView.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title></title>
        <link rel="icon" href="favicon.ico" type="image/x-icon" />
      </head>
      <body>
        <div id="root"></div>
        <script>

          if (!window._vscode) {
            window._vscode = acquireVsCodeApi();
          }

        </script>
        <script src="${scriptUri}"></script>
      </body>
    </html>
  `;
};

export const initLeftPanel = (context: vscode.ExtensionContext) => {
  return {
    disposable: vscode.window.registerWebviewViewProvider(
      WebviewKey,
      {
        resolveWebviewView: (webviewView) => {
          global._globalWebview = webviewView;
          return getWebview(webviewView, context);
        },
      },
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
    ),
  };
};
