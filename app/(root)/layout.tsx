import { onBoardUser } from "@/modules/auth/actions";
import NavBar from "@/modules/home/components/navbar";
import React from "react";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  await onBoardUser();
  return (
    <main className="flex flex-col min-h-screen relative overflow-x-hidden">
      <NavBar />
      <div className="fixed inset-0 z-0 h-full w-full bg-background dark:bg-[radial-gradient(#393e4a_1px,transparent_1px)]  bg-[radial-gradient(#dadde2_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="flex-1 relative z-10 w-full mt-20">{children}</div>
    </main>
  );
};

export default Layout;
