import React from 'react';
import dynamic from 'next/dynamic';

const JsonViewer = dynamic(() => import('./jsonViewer'), {
  ssr: false,
});

interface ResponseTemplateProps {
  details: {
    responses: {
      [key: string]: {
        description?: string;
        content?: {
          'application/json'?: {
            schema?: any;
          };
        };
      };
    };
  };
  activeResponseTab: string;
  setActiveResponseTab: (tab: string) => void;
}

const ResponseTemplate: React.FC<ResponseTemplateProps> = ({ details, activeResponseTab, setActiveResponseTab }) => {
  const statusColors = {
    '200': 'text-green-600 dark:text-green-400',
    '201': 'text-green-600 dark:text-green-400', 
    '204': 'text-green-600 dark:text-green-400',
    '400': 'text-yellow-600 dark:text-yellow-400',
    '401': 'text-red-600 dark:text-red-400',
    '403': 'text-red-600 dark:text-red-400',
    '404': 'text-red-600 dark:text-red-400',
    '405': 'text-yellow-600 dark:text-yellow-400',
    '500': 'text-red-600 dark:text-red-400'
  };

  return (
    <div className="mt-6 w-full">
      <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
        {Object.keys(details.responses || {}).map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setActiveResponseTab(code)}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              activeResponseTab === code
                ? `bg-background ${
                    statusColors[code as keyof typeof statusColors]
                  } shadow`
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
            data-state={activeResponseTab === code ? "active" : ""}
          >
            {code}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {Object.entries(details.responses || {}).map(
          ([code, response]: [string, any]) => (
            <div
              key={code}
              className={`${activeResponseTab === code ? "block" : "hidden"}`}
            >
              <JsonViewer
                title={`${code} - ${response.description || "Açıklama yok."}`}
                jsonData={response.content?.["application/json"]?.schema || {}}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ResponseTemplate;
