"use client";

import React, { useState, ReactNode } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "../Header/index.jsx";
import Sidebar from "../Sidebar";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
  isSidebarOpen?: boolean;
  isHeaderOpen?: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <>
      <div className="flex h-screen overflow-hidden w-full bg-white dark:bg-gray-900">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 flex w-full flex-col overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="mt-[72px]">
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10 bg-white dark:bg-gray-900">
              {children}
            </div>
          </main>
        </div>
      </div>
      <ToastContainer />
    </>
  );
}
