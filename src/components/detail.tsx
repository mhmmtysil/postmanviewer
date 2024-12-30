'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import openapi from '../data/collection.json';
import ResponseTemplate from './responseTemplate';

// JsonViewer'ı dinamik olarak import et
const JsonViewer = dynamic(() => import('./jsonViewer'), {
  ssr: false,
});

const RequestTemplate = dynamic(() => import('./requestTemplate'), {
  ssr: false,
});

const Detail = ({}) => {
  const [endpoint, setEndpoint] = useState<string>('');
  const [path, setPath] = useState<string>('');
  const [method, setMethod] = useState<string>('');
  const [endpointDetails, setEndpointDetails] = useState<any>(null);
  const [activeResponseTab, setActiveResponseTab] = useState<string>('200');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // HTTP metodları için renk kodları
  const methodColors = {
    get: 'text-blue-600 dark:text-blue-400',
    post: 'text-green-600 dark:text-green-400',
    put: 'text-yellow-600 dark:text-yellow-400',
    delete: 'text-red-600 dark:text-red-400',
    patch: 'text-purple-600 dark:text-purple-400',
  };

  // HTTP durum kodları için renk kodları
  const statusColors = {
    '200': 'text-green-600 dark:text-green-400',
    '201': 'text-green-600 dark:text-green-400',
    '204': 'text-green-600 dark:text-green-400',
    '400': 'text-yellow-600 dark:text-yellow-400',
    '401': 'text-red-600 dark:text-red-400',
    '403': 'text-red-600 dark:text-red-400',
    '404': 'text-red-600 dark:text-red-400',
    '405': 'text-yellow-600 dark:text-yellow-400',
    '500': 'text-red-600 dark:text-red-400',
  };

  useEffect(() => {
    const handleHashChange = () => {
      // Hash'i al ve başındaki # işaretini kaldır
      const hash = window.location.hash.slice(1);

      if (hash) {
        setEndpoint(hash);
        const [methodPart, ...pathParts] = hash.split('-');

        // URL'deki Request Bodyni düzelt ve - işaretini / ile değiştir
        const pathValue = `/${pathParts.join('/')}`
          .replace(/%2F/g, '/')
          .replace(/%7B/g, '{')
          .replace(/%7D/g, '}');

        setMethod(methodPart);
        setPath(pathValue);

        // OpenAPI'den endpoint detaylarını al
        const paths = openapi.paths || {};

        Object.entries(paths).forEach(([path, methods]: [string, any]) => {
          const normalizedPath = path.replace(/\{.*?\}/g, '.*');
          const regex = new RegExp(`^${normalizedPath}$`);

          // Path'deki - işaretlerini / ile değiştir ve kontrol et
          const normalizedPathValue = pathValue.replace(/-/g, '/');

          if (regex.test(normalizedPathValue)) {
            const methodDetails = methods[methodPart.toLowerCase()];
            if (methodDetails) {
              setEndpointDetails(methodDetails);
              // İlk response kodunu aktif tab olarak ayarla
              if (methodDetails.responses) {
                setActiveResponseTab(Object.keys(methodDetails.responses)[0]);
              }
              // Endpoint'e scroll yap
              const element = document.getElementById(hash);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }
        });
      }
    };

    // Sayfa ilk yüklendiğinde çalıştır
    handleHashChange();

    // Hash değişikliklerini dinle
    window.addEventListener('hashchange', handleHashChange);

    // Cleanup
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // İstek gövdesi ve yanıtlar bilgisi
  const requestBody =
    endpointDetails?.requestBody?.content?.['application/json']?.schema
      ?.properties || [];
  const responses = endpointDetails?.responses || {};

  return (
    <div className="px-4 md:px-0">
      {Object.entries(openapi.paths || {}).map(
        ([pathKey, methods]: [string, any]) => {
          return Object.entries(methods).map(
            ([methodKey, details]: [string, any]) => {
              const endpointId = `${methodKey}-${pathKey
                .slice(1)
                .replace(/\//g, '-')}`;

              // Path ve Query parametrelerini ayır
              const pathParams =
                details.parameters?.filter((p: any) => p.in === 'path') || [];
              const queryParams =
                details.parameters?.filter((p: any) => p.in === 'query') || [];

              return (
                <div
                  key={endpointId}
                  id={endpointId}
                  className="pt-16 -mt-16 flex flex-col lg:flex-row gap-4 w-full items-start justify-between"
                >
                  <div className="flex w-full lg:w-2/3 flex-col items-start bg-white p-4 md:p-6 rounded-lg shadow-sm border dark:bg-gray-800 dark:text-white">
                    {/* Başlık */}
                    <h2 className="group relative text-xl md:text-2xl font-bold text-black dark:text-white break-words">
                      <a
                        href={`#${endpointId}`}
                        className="before:content-['#'] no-underline absolute text-primary -left-[0.8em] pr-2.5 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity duration-200 hidden md:block"
                        aria-label={`Link to ${endpointId}`}
                      ></a>
                      <span
                        className={
                          methodColors[methodKey as keyof typeof methodColors]
                        }
                      >
                        {methodKey.toUpperCase()}
                      </span>{' '}
                      {details.summary || 'Endpoint Detayı'}
                    </h2>

                    {/* Açıklama */}
                    <div className="prose dark:prose-invert prose-neutral max-w-full prose-img:max-w-prose mt-4">
                      <p className="text-sm md:text-base">
                        {details.description || 'Açıklama bulunamadı.'}
                      </p>
                    </div>

                    {/* İstek Gövdesi - Sadece POST, PUT, PATCH metodları için */}
                    {['post', 'put', 'patch'].includes(
                      methodKey.toLowerCase(),
                    ) &&
                      details.requestBody?.content?.['application/json']?.schema
                        ?.properties && (
                        <div className="mt-6 w-full overflow-x-auto">
                          <JsonViewer
                            title="İstek Gövdesi"
                            jsonData={
                              details.requestBody.content['application/json']
                                .schema.properties
                            }
                          />
                        </div>
                      )}

                    {/* Request Body */}
                    {pathParams.length > 0 && (
                      <div className="mt-6 w-full">
                        <h3 className="text-base md:text-lg font-semibold mb-4">
                          Request Body
                        </h3>
                        <div className="space-y-4">
                          {pathParams.map((parameter: any) => (
                            <div
                              key={parameter.name}
                              className="border dark:border-gray-700 rounded-lg p-3 md:p-4"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-sm md:text-base">
                                  {parameter.name}
                                </span>
                                <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                  ({parameter.in})
                                </span>
                                {parameter.required && (
                                  <span className="text-xs text-red-500">
                                    *zorunlu
                                  </span>
                                )}
                              </div>
                              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-2">
                                {parameter.description || 'Açıklama bulunamadı'}
                              </p>
                              <div className="text-xs md:text-sm mt-1">
                                <span className="text-gray-500 dark:text-gray-400">
                                  Tip:{' '}
                                </span>
                                <code className="text-xs md:text-sm bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">
                                  {parameter.schema?.type || 'belirsiz'}
                                </code>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Query Parametreleri - Özellikle GET metodu için */}
                    {methodKey.toLowerCase() === 'get' &&
                      queryParams.length > 0 && (
                        <div className="mt-6 w-full">
                          <h3 className="text-base md:text-lg font-semibold mb-4">
                            Query Parametreleri
                          </h3>
                          <div className="space-y-4">
                            {queryParams.map((parameter: any) => (
                              <div
                                key={parameter.name}
                                className="border dark:border-gray-700 rounded-lg p-3 md:p-4"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium text-sm md:text-base">
                                    {parameter.name}
                                  </span>
                                  <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                    ({parameter.in})
                                  </span>
                                  {parameter.required && (
                                    <span className="text-xs text-red-500">
                                      *zorunlu
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-2">
                                  {parameter.description ||
                                    'Açıklama bulunamadı'}
                                </p>
                                <div className="text-xs md:text-sm mt-1">
                                  <span className="text-gray-500 dark:text-gray-400">
                                    Tip:{' '}
                                  </span>
                                  <code className="text-xs md:text-sm bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">
                                    {parameter.schema?.type || 'belirsiz'}
                                  </code>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Response Özellikleri */}
                    {details.responses && (
                      <div className="mt-6 w-full">
                        <h3 className="text-base md:text-lg font-semibold mb-4">
                          Responses
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {Object.keys(details.responses).map((statusCode) => (
                            <button
                              key={statusCode}
                              type="button"
                              onClick={() => setActiveResponseTab(statusCode)}
                              className={`px-2 md:px-3 py-1 rounded-md text-xs md:text-sm font-medium ${
                                activeResponseTab === statusCode
                                  ? `bg-gray-100 dark:bg-gray-700 ${
                                      statusColors[
                                        statusCode as keyof typeof statusColors
                                      ]
                                    }`
                                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                            >
                              {statusCode}
                            </button>
                          ))}
                        </div>
                        <div className="bg-[#0D1117] rounded-lg p-3 md:p-4 text-white overflow-x-auto">
                          {Object.entries(details.responses).map(
                            ([statusCode, response]: [string, any]) => (
                              <div
                                key={statusCode}
                                className={`${
                                  activeResponseTab === statusCode
                                    ? 'block'
                                    : 'hidden'
                                }`}
                              >
                                {response.content?.['application/json']?.schema
                                  ?.properties && (
                                  <div className="space-y-4">
                                    {Object.entries(
                                      response.content['application/json']
                                        .schema.properties,
                                    ).map(([key, value]: [string, any]) => (
                                      <div
                                        key={key}
                                        className="flex items-start gap-4 border-b border-gray-700 pb-4"
                                      >
                                        <div className="flex-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-white text-sm md:text-base">
                                              {key}
                                            </span>
                                            <span className="text-gray-400 text-xs md:text-sm">
                                              {value.type}
                                            </span>
                                            {!value.required && (
                                              <span className="text-xs text-gray-500">
                                                optional
                                              </span>
                                            )}
                                          </div>
                                          {value.description && (
                                            <p className="text-xs md:text-sm text-gray-400 mt-1">
                                              {value.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="w-full lg:w-1/3 sticky top-4">
                    <RequestTemplate
                      method={methodKey}
                      url={pathKey}
                      requestBody={
                        details.requestBody?.content?.['application/json']
                          ?.schema?.properties || {}
                      }
                    />
                    <ResponseTemplate
                      details={details}
                      activeResponseTab={activeResponseTab}
                      setActiveResponseTab={setActiveResponseTab}
                    />
                  </div>
                </div>
              );
            },
          );
        },
      )}
    </div>
  );
};

export default Detail;
