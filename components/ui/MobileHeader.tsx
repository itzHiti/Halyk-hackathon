'use client';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export default function MobileHeader({ title, subtitle, backHref, onBack, rightElement }: MobileHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
      <div className="flex items-center px-4 py-3 gap-3">
        <button
          onClick={handleBack}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <ChevronLeft size={22} className="text-gray-700" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-gray-900 truncate">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
        </div>
        {rightElement && <div className="flex-shrink-0">{rightElement}</div>}
      </div>
    </div>
  );
}
