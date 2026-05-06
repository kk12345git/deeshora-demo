import { trpc } from "@/lib/trpc";
import toast from "react-hot-toast";
import { Loader2, Truck, CheckCircle, Zap, MessageSquare, Save, IndianRupee, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

function SettingsField({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="text-orange-500">{icon}</div>
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{label}</label>
      </div>
      {children}
    </div>
  );
}

export default function AdminSettingsPage() {
  const { data: config, isLoading, refetch } = trpc.admin.getConfig.useQuery();
  const updateConfigMutation = trpc.admin.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("Settings updated!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const delivery_fee = formData.get('delivery_fee') as string;
    const free_delivery_above = formData.get('free_delivery_above') as string;
    const business_whatsapp = formData.get('business_whatsapp') as string;
    const delivery_partners = formData.get('delivery_partners') as string;
    const platform_fixed_fee = formData.get('platform_fixed_fee') as string;


    updateConfigMutation.mutate({ key: 'delivery_fee', value: delivery_fee });
    updateConfigMutation.mutate({ key: 'free_delivery_above', value: free_delivery_above });
    updateConfigMutation.mutate({ key: 'business_whatsapp', value: business_whatsapp });
    updateConfigMutation.mutate({ key: 'delivery_partners', value: delivery_partners });
    updateConfigMutation.mutate({ key: 'platform_fixed_fee', value: platform_fixed_fee });
  };


  if (isLoading) return <div className="flex justify-center"><Loader2 className="animate-spin" /></div>;


  const deliveryFee = config?.find((c: any) => c.key === 'delivery_fee')?.value || '40';
  const freeDeliveryAbove = config?.find((c: any) => c.key === 'free_delivery_above')?.value || '299';
  const businessWhatsapp = config?.find((c: any) => c.key === 'business_whatsapp')?.value || '918939318865';
  const deliveryPartners = config?.find((c: any) => c.key === 'delivery_partners')?.value || '';
  const platformFixedFee = config?.find((c: any) => c.key === 'platform_fixed_fee')?.value || '10';


  return (
    <div className="space-y-10">
      {/* Dynamic Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Core configuration</p>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">System Parameters</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Orchestrating <span className="text-gray-900 font-bold">global logistics thresholds</span> and platform revenue rules.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <div className="space-y-10">
          {/* Logistics Module */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8"
          >
            <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
               <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
                  <Truck size={22} />
               </div>
               <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">Logistics Engine</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Delivery & Fulfillment Rules</p>
               </div>
            </div>

            <div className="space-y-6">
              <SettingsField label="Base Delivery Fee (INR)" icon={<IndianRupee size={14} />}>
                <input type="number" name="delivery_fee" defaultValue={deliveryFee} className="w-full h-14 px-5 bg-gray-50 border-2 border-transparent rounded-2xl font-black text-lg focus:border-orange-400 focus:bg-white outline-none transition-all" />
              </SettingsField>

              <SettingsField label="Free Shipping Threshold (INR)" icon={<CheckCircle size={14} />}>
                <input type="number" name="free_delivery_above" defaultValue={freeDeliveryAbove} className="w-full h-14 px-5 bg-gray-50 border-2 border-transparent rounded-2xl font-black text-lg focus:border-orange-400 focus:bg-white outline-none transition-all" />
              </SettingsField>
            </div>
          </motion.div>

          {/* Revenue Module */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-950 p-10 rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
               <Zap size={120} className="text-orange-500" />
            </div>

            <div className="flex items-center gap-4 border-b border-white/5 pb-6 relative z-10">
               <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <IndianRupee size={22} />
               </div>
               <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Platform Economy</h2>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-0.5">Fixed Revenue Generation</p>
               </div>
            </div>

            <div className="relative z-10">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block">Fixed Fee Per Order (INR)</label>
              <div className="relative group">
                <IndianRupee size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-500" />
                <input 
                  type="number" 
                  name="platform_fixed_fee" 
                  defaultValue={platformFixedFee} 
                  className="w-full h-20 pl-14 pr-6 bg-white/5 border-2 border-white/10 rounded-[1.5rem] font-black text-3xl text-white focus:border-orange-500 outline-none transition-all" 
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-4 uppercase font-bold tracking-widest leading-relaxed">This amount is automatically deducted from vendor settlements for every successful transaction processed on the platform.</p>
            </div>
          </motion.div>
        </div>

        <div className="space-y-10">
          {/* Automation Module */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8"
          >
            <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
               <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                  <MessageSquare size={22} />
               </div>
               <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">Communication Bus</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">WhatsApp Automation Hub</p>
               </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Business Terminal (Prefix 91)</label>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    name="business_whatsapp" 
                    id="business_whatsapp" 
                    defaultValue={businessWhatsapp} 
                    className="flex-1 h-16 px-6 bg-gray-50 border-2 border-transparent rounded-2xl font-black text-lg focus:border-orange-400 focus:bg-white outline-none transition-all" 
                    placeholder="918939318865" 
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('business_whatsapp') as HTMLInputElement;
                      const num = input.value.replace(/[^0-9]/g, '');
                      window.open(`https://wa.me/${num}?text=System%20Check%20from%20Deeshora%20Admin%21%20%E2%9C%85`, '_blank');
                    }}
                    className="h-16 px-6 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
                  >
                    Ping
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Partner Network Nodes (Comma Separated)</label>
                <textarea 
                  name="delivery_partners" 
                  defaultValue={deliveryPartners} 
                  className="w-full p-6 bg-gray-50 border-2 border-transparent rounded-[1.5rem] font-black text-sm focus:border-orange-400 focus:bg-white outline-none transition-all resize-none" 
                  placeholder="919876543210, 911234567890" 
                  rows={4} 
                />
                <div className="flex items-center gap-2 text-gray-400">
                   <AlertCircle size={14} className="text-orange-500" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Forwarding order payloads after location handshake.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Terminal */}
          <div className="flex items-center justify-end">
            <button 
              type="submit" 
              disabled={updateConfigMutation.isPending}
              className="h-20 px-12 bg-gray-950 text-white rounded-[1.75rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all shadow-2xl shadow-gray-950/20 hover:bg-orange-600 active:scale-95 disabled:opacity-20"
            >
              {updateConfigMutation.isPending ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              Commit Global Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}