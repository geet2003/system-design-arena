import dynamic from 'next/dynamic';

const AuthDiagram = dynamic(() => import('@/components/canvas/AuthDiagram'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#f5f0e8]" />,
});

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-black">
      {/* Left panel — interactive system design diagram */}
      <div className="relative hidden w-[45%] overflow-hidden rounded-2xl m-4 lg:block">
        <AuthDiagram />
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center px-8">
        {children}
      </div>
    </div>
  );
}
