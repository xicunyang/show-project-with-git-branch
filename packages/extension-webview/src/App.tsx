import React, { useRef, useState } from "react";
import "./App.less";
import { Input, Spin, message } from "antd";
import useStateRealtime from "react-usestateref";

interface Window {
  _vscode: any;
}

declare const window: Window & typeof globalThis;

export interface IFolderItem {
  name: string;
  path: string;
  branchName?: string;
}

const App = () => {
  // 原始项目文件夹列表
  const [folderArr, setFolderArr, folderArrRef] = useStateRealtime<
    IFolderItem[]
  >([]);
  // 用户搜索后的文件夹列表
  const [searchList, setSearchList, searchListRef] =
    useStateRealtime<IFolderItem[]>();
  // 全局loading
  const [globalLoading, setGlobalLoading] = useState(false);
  // 当前hover的下标
  const [currentHoverIndex, setCurrentHoverIndex, currentHoverIndexRef] =
    useStateRealtime(0);

  // 输入框Ref
  const inputRef = useRef(null);

  // 当前使用的列表（搜索后，使用搜索的列表）
  const currentUsedList = searchListRef.current
    ? searchListRef.current
    : folderArrRef.current;

  // 监听插件的事件
  React.useEffect(() => {
    window._vscode.postMessage({ type: "GET_FRESH_PROJECT_WITH_GIT_BRANCH" });

    const handleMessage = (event: any) => {
      const msg = event.data;
      const { type, items } = msg;
      // 获取最新的列表
      if (type === "SEND_FRESH_PROJECT_WITH_GIT_BRANCH") {
        if (items && items?.length) {
          setFolderArr([...items]);
        }
        setGlobalLoading(false);
      }
      // loading
      if (type === "SEND_LOADING") {
        setGlobalLoading(true);
      }
      // 输入框聚焦
      if (type === "SET_FOCUS") {
        inputRef?.current?.focus({
          cursor: "end",
        });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // 打开编辑器
  const handleOpenFolder = (path: string, isOpenNew: boolean) => {
    window._vscode.postMessage({
      type: "OPEN_PROJECT",
      path,
      isOpenNew,
    });
    message.success("打开中...");
  };

  // 处理回车事件
  const handleEnter = (isOpenNew: boolean) => {
    if (currentHoverIndexRef.current >= 0) {
      const currentItem = currentUsedList?.[currentHoverIndexRef.current];
      if (currentItem) {
        handleOpenFolder(currentItem.path, isOpenNew);
      }
    }
  };

  // 监听键盘上下按键
  React.useEffect(() => {
    const handleEvent = (event: any) => {
      const maxLength = currentUsedList?.length || 0;

      if (event.keyCode === 38) {
        // 向上
        let next = currentHoverIndexRef.current - 1;
        if (currentHoverIndexRef.current <= -1) {
          next = -1;
        }
        if (next === -1) {
          inputRef?.current?.focus({
            cursor: "end",
          });
        }
        setCurrentHoverIndex(next);
      } else if (event.keyCode === 40) {
        // 向下
        const next = currentHoverIndexRef.current + 1;
        if (next < maxLength) {
          setCurrentHoverIndex(next);
        }
      } else if (event.keyCode === 13) {
        handleEnter(event.metaKey);
      }
    };

    document.addEventListener("keydown", handleEvent);
    return () => {
      document.removeEventListener("keydown", handleEvent);
    };
  }, [searchList, folderArr]);

  // 处理输入框输入事件
  const handleInput = (e: any) => {
    const keyword = e.target.value;

    setCurrentHoverIndex(0);

    if (keyword === "") {
      setSearchList(undefined);
      return;
    }

    const finalList = [...folderArrRef.current].filter((item) => {
      if (
        // 项目名
        item.name.includes(keyword) ||
        // 分支名
        item?.branchName?.includes(keyword) ||
        // 路径
        item.path.includes(keyword)
      ) {
        return true;
      }
    });

    setSearchList([...finalList]);
  };

  // 上下按键时，将高亮的行居中
  React.useEffect(() => {
    const item = document.querySelector(
      `.branch-name-item-${currentHoverIndexRef.current}`
    );
    item?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [currentHoverIndex]);

  return (
    <div className="branch-name-list-extension-wrapper">
      <div className="main-title">
        📜<span>常用项目列表</span>
      </div>
      <div className="body-wrapper">
        <div style={{ marginBottom: "8px" }}>
          <Input
            placeholder="输入关键字搜索 项目名 / 分支"
            onInput={handleInput}
            ref={inputRef}
          />
        </div>
        <Spin spinning={globalLoading} className="branch-name-list-global-spin">
          <div className="body-list-wrapper">
            {currentUsedList?.map((folderItem, idx) => {
              return (
                <div key={folderItem.path}>
                  <div
                    className={`tools-item ${
                      currentHoverIndex === idx ? "is-hover" : ""
                    } branch-name-item-${idx}`}
                    onClick={(e) => {
                      handleOpenFolder(folderItem.path, e.metaKey);
                    }}
                  >
                    <div className="item-title">
                      <div>
                        <span className="item-main-title">
                          {folderItem.name}
                        </span>
                        {folderItem.branchName && (
                          <span className="item-branch-name">
                            {folderItem.branchName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="item-body">
                      <div className="item-desc">{folderItem.path}</div>
                    </div>
                  </div>
                  <div className="slide-line"></div>
                </div>
              );
            })}
          </div>
        </Spin>
      </div>
    </div>
  );
};

export default App;
