import { JourneyProgress } from "@/components/Layout/JourneyProgress";

export default function JourneyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-full">
      <JourneyProgress />
      <div className="flex-grow max-w-4xl w-full mx-auto p-4 md:p-8">
        {children}
      </div>
    </div>
  );
}
