'use client';

import React, { useEffect, useRef, useState } from 'react';
import openapi from '../../data/collection.json';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>(
    {},
  );
  const tags = openapi.tags || [];
  const paths = openapi.paths || {};

  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);

  let storedSidebarExpanded = 'true';

  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === 'true',
  );

  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  useEffect(() => {
    const keyHandler = ({ key }: KeyboardEvent) => {
      if (!sidebarOpen || key !== 'Escape') return;
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

  useEffect(() => {
    localStorage.setItem('sidebar-expanded', sidebarExpanded.toString());
    if (sidebarExpanded) {
      document.querySelector('body')?.classList.add('sidebar-expanded');
    } else {
      document.querySelector('body')?.classList.remove('sidebar-expanded');
    }
  }, [sidebarExpanded]);

  React.useEffect(() => {
    const sections: { [key: string]: boolean } = {};
    tags.forEach((tag: any) => {
      sections[tag.name] = true;
    });
    setOpenSections(sections);
  }, [tags]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleMethodClick = (path: string, method: string) => {
    const anchor = `${method}-${path.slice(1).replace(/\//g, '-')}`;
    window.location.hash = anchor;
  };

  return (
    <aside
      ref={sidebar}
      className={`absolute left-0 top-0 z-[1] border-r border-gray-200 dark:border-gray-800 flex h-screen w-72.5 p-4 flex-col overflow-y-hidden bg-white dark:bg-gray-900 duration-300 ease-linear lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <button
        ref={trigger}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-controls="sidebar"
        aria-expanded={sidebarOpen}
        className="block lg:hidden my-4"
      >
        <svg
          className="fill-current text-black dark:text-white"
          width="20"
          height="18"
          viewBox="0 0 20 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <h1 className="text-xl font-bold mb-4 text-black dark:text-white">
        {openapi.info.title}
      </h1>
      {tags.map((tag: any) => (
        <div key={tag.name} className="flex flex-col">
          <div
            onClick={() => toggleSection(tag.name)}
            className="cursor-pointer flex items-center justify-between p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <span>{tag.name}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transform transition-transform ${
                openSections[tag.name] ? 'rotate-90' : ''
              }`}
            >
              <path d="M9 18l6-6-6-6"></path>
            </svg>
          </div>
          {openSections[tag.name] && (
            <ul className="pl-4 mt-2 space-y-2">
              {Object.entries(paths)
                .filter(([_, pathDetails]: any) =>
                  pathDetails?.[Object.keys(pathDetails)[0]]?.tags?.includes(
                    tag.name,
                  ),
                )
                .map(([path, pathDetails]: any) => (
                  <li key={path}>
                    {Object.entries(pathDetails).map(
                      ([method, details]: any) => (
                        <div
                          key={method}
                          onClick={() => handleMethodClick(path, method)}
                          className="mt-2 flex flex-row items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded text-gray-900 dark:text-gray-100"
                        >
                          <p className="text-sm mt-1 text-gray-900 dark:text-gray-100">
                            {details.summary}
                          </p>
                          <span
                            className={`uppercase font-mono text-xs px-2 py-1 rounded ${
                              method === 'get'
                                ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200'
                                : method === 'post'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200'
                                : method === 'delete'
                                ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200'
                            }`}
                          >
                            {method}
                          </span>
                        </div>
                      ),
                    )}
                  </li>
                ))}
            </ul>
          )}
        </div>
      ))}
    </aside>
  );
};

export default Sidebar;
