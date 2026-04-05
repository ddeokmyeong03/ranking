import BottomNav from "@/components/layout/BottomNav";

export default function UnitLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { code: string };
}) {
  return (
    <div className="min-h-screen bg-bg pb-20">
      <div className="max-w-lg mx-auto">{children}</div>
      <BottomNav unitCode={params.code} />
    </div>
  );
}
