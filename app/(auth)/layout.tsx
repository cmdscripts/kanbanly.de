import { LegalFooter } from '@/components/LegalFooter';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-emerald-400 grid place-items-center font-bold text-white text-sm shadow-lg shadow-violet-500/20">
              k
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-100 tracking-tight leading-none">
                kanbanly
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Flow first. Build fast.
              </p>
            </div>
          </div>
          {children}
        </div>
      </div>
      <LegalFooter />
    </div>
  );
}
