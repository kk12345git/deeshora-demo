import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/customer/MobileBottomNav";
import Footer from "@/components/layout/Footer";
import AmbienceBackdrop from "@/components/customer/AmbienceBackdrop";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0 theme-customer relative overflow-hidden">
      <AmbienceBackdrop />
      <Navbar />
      <main className="flex-grow relative z-10">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
