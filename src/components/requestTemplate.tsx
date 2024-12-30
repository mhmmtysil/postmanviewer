import React, { useState, useEffect, useCallback } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import openapi from "../data/collection.json";

interface RequestExampleProps {
  method: string;
  url: string;
  requestBody: Record<string, any>;
}

const RequestExample: React.FC<RequestExampleProps> = ({
  method,
  url,
  requestBody,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("cURL");
  const [showTestModal, setShowTestModal] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testHeaders, setTestHeaders] = useState<{ [key: string]: string }>({
    "Content-Type": "application/json",
  });
  const [testBody, setTestBody] = useState(
    JSON.stringify(requestBody || {}, null, 2)
  );
  const [pathParams, setPathParams] = useState<{ [key: string]: string }>({});
  const [queryParams, setQueryParams] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTab] = useState("headers");
  const [loading, setLoading] = useState(false);
  const [pathParameters, setPathParameters] = useState<any[]>([]);
  const [queryParameters, setQueryParameters] = useState<any[]>([]);

  // OpenAPI'den path ve query parametrelerini al
  const getPathAndQueryParams = useCallback(() => {
    const paths = openapi.paths;
    for (const [pathUrl, pathObj] of Object.entries(paths)) {
      const normalizedPathUrl = pathUrl.replace(/\{([^}]+)\}/g, "{$1}");
      const normalizedUrl = url.replace(/\{([^}]+)\}/g, "{$1}");

      if (normalizedPathUrl === normalizedUrl) {
        const methodKey = method.toLowerCase();
        if (typeof pathObj === "object" && pathObj !== null) {
          const methodOperations = pathObj as {
            [key: string]: {
              parameters?: Array<{
                in: string;
                name: string;
                required?: boolean;
                schema?: any;
                description?: string;
              }>;
              requestBody?: {
                content?: {
                  "application/json"?: {
                    schema?: any;
                  };
                };
              };
            };
          };

          const operation = methodOperations[methodKey];
          if (operation) {
            const pathParams =
              operation.parameters?.filter((p) => p.in === "path") || [];
            const queryParams =
              operation.parameters?.filter((p) => p.in === "query") || [];

            setPathParameters(pathParams);
            setQueryParameters(queryParams);

            // Path parametrelerini otomatik doldur
            const initialPathParams: { [key: string]: string } = {};
            pathParams.forEach((param) => {
              initialPathParams[param.name] = "";
            });
            setPathParams(initialPathParams);

            // Query parametrelerini otomatik doldur
            const initialQueryParams: { [key: string]: string } = {};
            queryParams.forEach((param) => {
              initialQueryParams[param.name] = "";
            });
            setQueryParams(initialQueryParams);

            // Request body'yi otomatik doldur
            if (operation.requestBody && method.toUpperCase() !== "GET") {
              setTestBody(JSON.stringify(requestBody || {}, null, 2));
            }

            return;
          }
        }
      }
    }
  }, [method, url, requestBody]);

  useEffect(() => {
    getPathAndQueryParams();
  }, [getPathAndQueryParams]);

  const languages = [
    "cURL",
    "JavaScript",
    "Python",
    "Java",
    "Go",
    "C#",
    "Kotlin",
    "Objective-C",
    "PHP",
    "Ruby",
    "Swift",
  ];

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const handleTest = async () => {
    setLoading(true);
    try {
      const baseUrl =
        openapi.servers?.[0]?.url ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:3000";

      let finalUrl = url;
      Object.entries(pathParams).forEach(([key, value]) => {
        finalUrl = finalUrl.replace(`{${key}}`, value);
      });

      const queryString = Object.entries(queryParams)
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        )
        .join("&");

      const fullUrl = `${baseUrl}${finalUrl}${
        queryString ? `?${queryString}` : ""
      }`;

      const requestOptions: RequestInit = {
        method: method.toUpperCase(),
        headers: testHeaders,
        credentials: "include",
      };

      if (method.toUpperCase() !== "GET") {
        requestOptions.body = testBody;
      }

      const response = await fetch(fullUrl, requestOptions);

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      setTestResponse({
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      });
    } catch (error: any) {
      setTestResponse({
        error: error.message || "Bir hata oluştu",
      });
    }
    setLoading(false);
  };

  const getCodeSnippet = () => {
    const baseUrl = openapi.servers?.[0]?.url || "http://localhost:3000";
    const queryString = Object.entries(queryParams)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join("&");
    const fullUrl = `${baseUrl}${url}${queryString ? `?${queryString}` : ""}`;

    switch (selectedLanguage) {
      case "cURL":
        return `curl -X ${method.toUpperCase()} "${fullUrl}" \\
  -H "Content-Type: application/json" \\
  ${
    method.toUpperCase() !== "GET" ? `-d '${JSON.stringify(requestBody)}'` : ""
  }`;

      case "JavaScript":
        return `fetch("${fullUrl}", {
  method: "${method.toUpperCase()}",
  headers: {
    "Content-Type": "application/json",
  },
  ${
    method.toUpperCase() !== "GET"
      ? `body: JSON.stringify(${JSON.stringify(requestBody)})`
      : ""
  }
})
.then(response => response.json())
.then(data => console.log(data));`;

      default:
        return "Seçilen dil için örnek kod henüz eklenmedi.";
    }
  };

  const handleModalOpen = () => {
    setShowTestModal(true);
    setTestHeaders({ "Content-Type": "application/json" });
    setTestBody(JSON.stringify(requestBody || {}, null, 2));
    setActiveTab("headers");
  };

  return (
    <div className="rounded-lg border bg-gray-50 dark:bg-gray-900 shadow p-4 text-black dark:text-white">
      {/* HTTP Method ve URL */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className={`uppercase text-sm font-semibold px-2 py-1 rounded ${
              method === "get"
                ? "bg-green-200 text-green-700"
                : method === "post"
                ? "bg-blue-200 text-blue-700"
                : method === "put"
                ? "bg-yellow-200 text-yellow-700"
                : "bg-red-200 text-red-700"
            }`}
          >
            {method}
          </span>
          <span className="text-sm font-mono">{url}</span>
        </div>
        <button
          onClick={handleModalOpen}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
        >
          Test
        </button>
      </div>

      {/* Test Modal */}
      {showTestModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
          onClick={() => setShowTestModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-md p-6 w-3/4 h-[80vh] flex z-9999"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sol Panel - İstek Detayları */}
            <div className="w-1/2 pr-4 overflow-y-auto border-r dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">API Test</h3>
              </div>

              {/* URL ve Send Butonu */}
              <div className="flex flex-col mb-4">
                <div className="flex items-center">
                  <div
                    className={`inline-flex items-center p-2 rounded text-sm font-semibold ${
                      method === "get"
                        ? "bg-green-200 text-green-700"
                        : method === "post"
                        ? "bg-blue-200 text-blue-700"
                        : method === "put"
                        ? "bg-yellow-200 text-yellow-700"
                        : "bg-red-200 text-red-700"
                    }`}
                  >
                    {method.toUpperCase()}
                  </div>
                  <div className="flex-1 p-2 dark:bg-gray-700">
                    {openapi.servers?.[0]?.url ||
                      process.env.NEXT_PUBLIC_API_URL ||
                      "http://localhost:3000"}
                    {Object.entries(pathParams).reduce(
                      (acc, [key, value]) => acc.replace(`{${key}}`, value),
                      url
                    )}
                    {Object.keys(queryParams).length > 0 && "?"}
                    {Object.entries(queryParams)
                      .map(([key, value]) => `${key}=${value}`)
                      .join("&")}
                  </div>
                  <button
                    onClick={handleTest}
                    disabled={loading}
                    className={`px-4 py-2 rounded ${
                      loading ? "bg-gray-500" : "bg-blue-500 hover:bg-blue-600"
                    } text-white`}
                  >
                    {loading ? "İstek Gönderiliyor..." : "İstek Gönder"}
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b mb-4">
                <button
                  className={`px-4 py-2 ${
                    activeTab === "headers" ? "border-b-2 border-blue-500" : ""
                  }`}
                  onClick={() => setActiveTab("headers")}
                >
                  Headers ({Object.keys(testHeaders).length})
                </button>
                <button
                  className={`px-4 py-2 ${
                    activeTab === "parameters"
                      ? "border-b-2 border-blue-500"
                      : ""
                  }`}
                  onClick={() => setActiveTab("parameters")}
                >
                  Parameters ({pathParameters.length})
                </button>
                <button
                  className={`px-4 py-2 ${
                    activeTab === "query" ? "border-b-2 border-blue-500" : ""
                  }`}
                  onClick={() => setActiveTab("query")}
                >
                  Query ({queryParameters.length})
                </button>
                {method.toUpperCase() !== "GET" && (
                  <button
                    className={`px-4 py-2 ${
                      activeTab === "body" ? "border-b-2 border-blue-500" : ""
                    }`}
                    onClick={() => setActiveTab("body")}
                  >
                    Body
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div className="mb-4">
                {activeTab === "headers" && (
                  <div>
                    <div className="space-y-2">
                      {Object.entries(testHeaders).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded"
                        >
                          <span className="font-medium flex-1">{key}:</span>
                          <input
                            className="flex-1 p-2 border rounded dark:bg-gray-700"
                            value={value}
                            onChange={(e) =>
                              setTestHeaders((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "parameters" && (
                  <div>
                    {pathParameters.map((param) => (
                      <div key={param.name} className="flex gap-2 mb-2">
                        <span className="flex-1 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                          {param.name}
                          {param.required && (
                            <span className="text-red-500">*</span>
                          )}
                        </span>
                        <input
                          className="flex-1 p-2 border rounded dark:bg-gray-700"
                          value={pathParams[param.name] || ""}
                          onChange={(e) =>
                            setPathParams((prev) => ({
                              ...prev,
                              [param.name]: e.target.value,
                            }))
                          }
                          placeholder={
                            param.description || `Enter ${param.name} value`
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "query" && (
                  <div>
                    {queryParameters.map((param) => (
                      <div key={param.name} className="flex gap-2 mb-2">
                        <span className="flex-1 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                          {param.name}
                          {param.required && (
                            <span className="text-red-500">*</span>
                          )}
                        </span>
                        <input
                          className="flex-1 p-2 border rounded dark:bg-gray-700"
                          value={queryParams[param.name] || ""}
                          onChange={(e) =>
                            setQueryParams((prev) => ({
                              ...prev,
                              [param.name]: e.target.value,
                            }))
                          }
                          placeholder={
                            param.description || `Enter ${param.name} value`
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "body" && method.toUpperCase() !== "GET" && (
                  <div>
                    <textarea
                      className="w-full h-40 p-2 font-mono text-sm border rounded dark:bg-gray-700"
                      value={testBody}
                      onChange={(e) => setTestBody(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Sağ Panel - Response */}
            <div className="w-1/2 pl-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Response</h3>
                <button
                  onClick={() => setShowTestModal(false)}
                  className="text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  ✕
                </button>
              </div>
              {testResponse ? (
                <div className="h-full">
                  <SyntaxHighlighter
                    language="json"
                    style={vscDarkPlus}
                    className="whitespace-pre-wrap"
                    wrapLines={true}
                  >
                    {JSON.stringify(testResponse, null, 2)}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Hadi bir istek gönder ve sonucu burada gör! 🚀</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Kod Örneği */}
      <div className="mt-4">
        <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-auto">
          <code className="text-gray-700 dark:text-gray-200">
            {getCodeSnippet()}
          </code>
        </pre>
      </div>

      {/* JSON Gösterimi */}
      <div className="mt-4">
        <button
          onClick={toggleCollapse}
          className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md transition"
        >
          {isCollapsed ? "Kodu Genişlet" : "Kodu Daralt"}
        </button>
        {!isCollapsed && (
          <div className="mt-4">
            <SyntaxHighlighter
              language="json"
              style={vscDarkPlus}
              showLineNumbers
            >
              {JSON.stringify(requestBody, null, 2)}
            </SyntaxHighlighter>
          </div>
        )}
      </div>

      {/* Dil Seçimi Dropdown */}
      <div className="mt-4">
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="w-full p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
        >
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default RequestExample;
