import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: number;
  showNumber?: boolean;
}

export default function StarRating({ rating, size = 14, showNumber = true }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {stars.map((star) => (
          <Star
            key={star}
            size={size}
            className={star <= Math.round(rating) ? 'star-filled' : 'star-empty'}
          />
        ))}
      </div>
      {showNumber && (
        <span className="text-sm font-semibold text-gray-800">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
