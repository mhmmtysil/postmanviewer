import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface JsonViewerProps {
  title: string;
  jsonData: Record<string, any>;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ title, jsonData }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCopyMessage, setShowCopyMessage] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
    setShowCopyMessage(true);
    setTimeout(() => {
      setShowCopyMessage(false);
    }, 2000);
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-md shadow-md p-4">
      <div className="flex flex-1 w-full justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {title}
        </h3>
        <div className="flex gap-2 items-center ">
          {showCopyMessage && (
            <span className="text-green-500 text-sm">Kopyalandı</span>
          )}
          <button
            onClick={handleCopy}
            className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded"
          >
            Kopyala
          </button>
          <button
            onClick={toggleCollapse}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded"
          >
            {isCollapsed ? "Genişlet" : "Daralt"}
          </button>
        </div>
      </div>
      {!isCollapsed && (
        <SyntaxHighlighter
          language="json"
          style={vscDarkPlus}
          showLineNumbers
          wrapLines
        >
          {JSON.stringify(jsonData, null, 2)}
        </SyntaxHighlighter>
      )}
    </div>
  );
};

export default JsonViewer;
