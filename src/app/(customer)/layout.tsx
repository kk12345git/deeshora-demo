// src/app/(customer)/layout.tsx
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/customer/MobileBottomNav";


export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <footer className="bg-gray-100 border-t hidden md:block">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Deeshora. All rights reserved.
        </div>
      </footer>
      <MobileBottomNav />
    </div>
  );
}