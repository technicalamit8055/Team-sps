import React from 'react';
import {
  Home,
  FileSpreadsheet,
  Receipt,
  FolderKanban,
  BarChart3,
  Crown,
  Users,
  QrCode,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';

interface DurgaPujaSidebarProps {
  activeTab: string;
  onSelectTab: (tab: any) => void;
  onOpenQR: () => void;
  onOpenCashierSheet: () => void;
  onOpenSettings: () => void;
  onOpenSeva?: () => void;
  isCollector?: boolean;
  workerName?: string;
  onCloseMobileDrawer?: () => void;
}

export const DurgaPujaSidebar: React.FC<DurgaPujaSidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenQR,
  onOpenCashierSheet,
  onOpenSettings,
  onOpenSeva,
  isCollector = false,
  workerName,
  onCloseMobileDrawer,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'डैशबोर्ड',
      icon: Home,
      action: () => onSelectTab('chanda'),
      isActive: activeTab === 'dashboard' || activeTab === 'chanda',
    },
    {
      id: 'chanda',
      label: 'चंदा रजिस्टर',
      icon: FileSpreadsheet,
      action: () => onSelectTab('chanda'),
      isActive: activeTab === 'chanda',
    },
    {
      id: 'receipts',
      label: 'डिजिटल पर्ची',
      icon: Receipt,
      action: onOpenCashierSheet,
      isAction: true,
    },
    {
      id: 'kharcha',
      label: 'पंडाल एवं पूजा व्यय',
      icon: FolderKanban,
      action: () => onSelectTab('kharcha'),
      isActive: activeTab === 'kharcha',
      hideForCollector: true,
    },
    {
      id: 'analytics',
      label: 'रिपोर्ट एवं लेखा',
      icon: BarChart3,
      action: () => onSelectTab('analytics'),
      isActive: activeTab === 'analytics',
      hideForCollector: true,
    },
    {
      id: 'donors',
      label: 'दानवीर सूची',
      icon: Crown,
      action: () => onSelectTab('donors'),
      isActive: activeTab === 'donors',
    },
    {
      id: 'seva',
      label: 'सेवा-जोड़ा',
      icon: Users,
      action: onOpenSeva || onOpenCashierSheet,
      isAction: true,
    },
    {
      id: 'qr',
      label: 'QR / UPI',
      icon: QrCode,
      action: onOpenQR,
      isAction: true,
    },
    {
      id: 'settings',
      label: 'सेटिंग्स',
      icon: Settings,
      action: onOpenSettings,
      isAction: true,
      hideForCollector: true,
    },
  ];

  return (
    <aside className="w-52 lg:w-56 h-full flex flex-col bg-gradient-to-b from-[#3a050e] via-[#2a0309] to-[#1b0206] text-white border-r border-[#691420]/70 shadow-2xl relative select-none shrink-0">
      {/* Subtle ornate gold top rim */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-yellow-300 to-rose-600" />

      {/* Mobile Close Button */}
      {onCloseMobileDrawer && (
        <button
          type="button"
          onClick={onCloseMobileDrawer}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-rose-200 hover:text-white md:hidden z-10"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Top Sacred Crest & Om Trishul */}
      <div className="pt-3 pb-2 px-3 text-center">
        <div className="inline-flex items-center justify-center p-1 rounded-full bg-amber-500/10 border border-amber-400/20 shadow-inner mb-2">
          <img
            src="/images/durga/sacred-trishul-om.jpg"
            alt="Om Trishul"
            className="w-7 h-7 object-contain rounded-full filter drop-shadow"
          />
        </div>

        {/* Circular Maa Durga Avatar Medallion */}
        <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-600 shadow-2xl ring-2 ring-amber-400/40 group cursor-pointer transition-transform hover:scale-105">
          <div className="w-full h-full rounded-full overflow-hidden border border-amber-300/60 bg-[#2d040a]">
            <img
              src="/images/durga/durga-avatar.jpg"
              alt="Maa Durga"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full shadow-md whitespace-nowrap border border-white/40">
            माँ दुर्गा
          </div>
        </div>
      </div>

      {/* Navigation Menu List */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map(item => {
          if (isCollector && item.hideForCollector) return null;

          const active = item.isActive;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                item.action();
                if (onCloseMobileDrawer) onCloseMobileDrawer();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-serif font-bold rounded-xl transition-all text-left ${
                active
                  ? 'bg-gradient-to-r from-[#cf1d32] to-[#990e1f] text-white shadow-lg shadow-rose-950/70 border border-rose-400/50 ring-1 ring-amber-400/30 font-extrabold translate-x-0.5'
                  : 'text-rose-100/80 hover:text-white hover:bg-white/10 border border-transparent'
              }`}
            >
              <item.icon
                className={`w-4 h-4 shrink-0 transition-transform ${
                  active ? 'text-amber-200 scale-110' : 'text-rose-300/80'
                }`}
              />
              <span className="truncate">{item.label}</span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-300 shadow-xs shadow-amber-300" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Sacred Footer: Jai Mata Di */}
      <div className="p-3 border-t border-[#691420]/70 bg-black/25 text-center relative overflow-hidden">
        <div className="flex items-center justify-center gap-1.5 text-amber-300 mb-1">
          <span className="text-sm">🙏</span>
          <span className="text-xs font-black font-serif tracking-widest text-amber-300 drop-shadow">
            || जय माता दी ||
          </span>
          <span className="text-sm">🙏</span>
        </div>
        <p className="text-[9px] text-amber-200/60 font-serif">
          सच्ची श्रद्धा • अखंड भक्ति
        </p>
      </div>
    </aside>
  );
};

export default DurgaPujaSidebar;
