import Link from 'next/link';
import { CheckCircle, Clock, Briefcase } from 'lucide-react';
import StarRating from './ui/StarRating';
import { Expert } from '@/lib/mock-data';

interface ExpertCardProps {
  expert: Expert;
  aiReason?: string;
  isTopPick?: boolean;
}

export default function ExpertCard({ expert, aiReason, isTopPick }: ExpertCardProps) {
  return (
    <Link href={`/client/experts/${expert.id}`}>
      <div className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-halyk hover:shadow-md transition-all active:scale-98">
        {isTopPick && (
          <div className="flex items-center gap-1.5 mb-3 bg-halyk-light rounded-lg px-2.5 py-1.5 w-fit">
            <span className="text-xs font-semibold text-halyk-dark">⭐ Рекомендация AI</span>
          </div>
        )}

        <div className="flex gap-3">
          <div className="relative flex-shrink-0">
            <img
              src={expert.avatar}
              alt={expert.name}
              className="w-14 h-14 rounded-full bg-gray-100 object-cover"
            />
            {expert.is_verified && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full">
                <CheckCircle size={16} className="text-halyk fill-halyk" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{expert.name}</h3>
                <p className="text-xs text-halyk font-medium">{expert.categoryLabel}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-gray-900">
                  {expert.hourly_rate.toLocaleString('ru')} ₸
                </p>
                <p className="text-xs text-gray-400">/ час</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-1.5">
              <StarRating rating={expert.rating} size={12} />
              <span className="text-xs text-gray-400">·</span>
              <div className="flex items-center gap-1">
                <Briefcase size={11} className="text-gray-400" />
                <span className="text-xs text-gray-500">{expert.completed_deals} сделок</span>
              </div>
            </div>

            <div className="flex items-center gap-1 mt-1">
              <Clock size={11} className="text-gray-400" />
              <span className="text-xs text-gray-400">Ответ {expert.response_time}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {expert.specializations.slice(0, 3).map((spec) => (
            <span
              key={spec}
              className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5"
            >
              {spec}
            </span>
          ))}
        </div>

        {aiReason && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="font-medium text-halyk-dark">AI: </span>
              {aiReason}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
