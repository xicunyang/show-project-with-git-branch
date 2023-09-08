import React, { useRef, useState } from "react";
import "./App.less";
import { ArrowRight } from "@icon-park/react";
import { Input, Spin, message } from "antd";
import { useStateRealtime } from "@byted/hooks";

declare const window: {
  _vscode: any;
  [index: string]: any;
};

export interface IFolderItem {
  name: string;
  path: string;
  branchName?: string;
}

const App = () => {
  const [, setFolderArr, folderArr] = useStateRealtime<IFolderItem[]>([]);
  const [, setSearchList, searchList] = useStateRealtime();
  const [globalLoading, setGlobalLoading] = useState(false);
  const [, setCurrentHoverIndex, currentHoverIndex] = useStateRealtime(0);

  const inputRef = useRef(null);

  const mapList = searchList() ? searchList() : folderArr();

  console.log('xxxxx');
  

  React.useEffect(() => {
    window._vscode.postMessage({ type: "GET_FRESH_PROJECT_WITH_GIT_BRANCH" });

    const handleMessage = (event: any) => {
      const msg = event.data;
      const { type, items } = msg;
      if (type === "SEND_FRESH_PROJECT_WITH_GIT_BRANCH") {
        if (items && items?.length) {
          setFolderArr([...items]);
        }
        setGlobalLoading(false);
      }
      if (type === "SEND_LOADING") {
        setGlobalLoading(true);
      }
      if (type === "SET_FOCUS") {
        console.log('focus...');
        
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

  const handleOpenFolder = (path: string) => {
    window._vscode.postMessage({
      type: "OPEN_PROJECT",
      path,
    });
    message.success("正在打开中...");
    // window._vscode.postMessage({ type: "GET_FRESH_PROJECT_WITH_GIT_BRANCH" });
  };

  const handleEnter = () => {
    if (currentHoverIndex() >= 0) {
      const currentItem = mapList?.[currentHoverIndex()];
      if (currentItem) {
        handleOpenFolder(currentItem.path);
      }
    }
  };

  React.useEffect(() => {
    const handleEvent = (event: any) => {
      const maxLength = mapList?.length || 0;

      if (event.keyCode === 38) {
        // 向上
        let next = currentHoverIndex() - 1;
        if (currentHoverIndex() <= -1) {
          next = -1;
        }
        if (next === -1) {
          inputRef?.current?.focus({
            cursor: "end",
          });
        }
        setCurrentHoverIndex(next);
      } else if (event.keyCode === 40) {
        // inputRef?.current?.blur();
        // 向下
        const next = currentHoverIndex() + 1;
        if (next < maxLength) {
          setCurrentHoverIndex(next);
        }
      } else if (event.keyCode === 13) {
        handleEnter();
      }
    };

    document.addEventListener("keydown", handleEvent);
    return () => {
      document.removeEventListener("keydown", handleEvent);
    };
  }, [searchList(), folderArr()]);

  const handleInput = (e: any) => {
    const keyword = e.target.value;

    setCurrentHoverIndex(0);

    if (keyword === "") {
      setSearchList(undefined);
      return;
    }

    const finalList = [...folderArr()].filter((item) => {
      if (item.name.includes(keyword)) {
        return true;
      }
      if (item.branchName?.includes(keyword)) {
        return true;
      }
      if (item.path.includes(keyword)) {
        return true;
      }
    });

    setSearchList([...finalList]);
  };

  React.useEffect(() => {
    const item = document.querySelector(
      `.data-360-ecop-searcher-search-result-item-${currentHoverIndex()}`
    );
    item?.scrollIntoView({
      behavior: "smooth",
    });
  }, [currentHoverIndex()]);

  return (
    <div className="lander-extension-wrapper">
      <div className="main-title">
        📜<span>常用项目列表</span>
      </div>
      <Spin spinning={globalLoading}>
        <div className="body-wrapper">
          <div style={{ marginBottom: "8px" }}>
            <Input
              placeholder="输入关键字搜索 项目名 / 分支"
              onInput={handleInput}
              ref={inputRef}
            />
          </div>
          <div className="body-list-wrapper">
            {mapList?.map((folderItem, idx) => {
              return (
                <div key={folderItem.path}>
                  <div
                    className={`tools-item ${
                      currentHoverIndex() === idx ? "is-hover" : ""
                    }`}
                    onClick={() => {
                      handleOpenFolder(folderItem.path);
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
        </div>
      </Spin>
    </div>
  );
};

export default App;
