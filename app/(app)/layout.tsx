import { Nav } from '@/components/Nav';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Nav />
      {children}
    </div>
  );
}
