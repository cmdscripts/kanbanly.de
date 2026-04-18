import { Nav } from '@/components/Nav';
import { CommandPaletteHost } from '@/components/CommandPaletteHost';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Nav />
      {children}
      <CommandPaletteHost />
    </div>
  );
}
