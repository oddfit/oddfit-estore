import React, { useEffect, useRef, useState } from 'react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  suggestions?: string[];
  className?: string;
};

const DEFAULT_SUGGESTIONS = [
  'Search size: S+',
  'Search size: M+',
  'Search color: Black',
  'Try: linen shirt',
  'Try: price<999',
];

export default function AnimatedSearchInput({
  value,
  onChange,
  suggestions = DEFAULT_SUGGESTIONS,
  className = '',
}: Props) {
  const [display, setDisplay] = useState('');
  const [i, setI] = useState(0);     // current suggestion index
  const [pos, setPos] = useState(0); // character index
  const [deleting, setDeleting] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (value) {
      if (timer.current) window.clearTimeout(timer.current);
      return;
    }

    const current = suggestions[i % suggestions.length];
    const isComplete = pos === current.length;
    const isEmpty = pos === 0;

    const speed = deleting ? 25 : 45;
    const pauseAtEnd = 1200;
    const pauseAtStart = 300;

    const next = () => {
      if (!deleting) {
        if (!isComplete) {
          setDisplay(current.slice(0, pos + 1));
          setPos(pos + 1);
        } else {
          setDeleting(true);
        }
      } else {
        if (!isEmpty) {
          setDisplay(current.slice(0, pos - 1));
          setPos(pos - 1);
        } else {
          setDeleting(false);
          setI((i + 1) % suggestions.length);
        }
      }
    };

    const delay =
      !deleting && isComplete ? pauseAtEnd :
      deleting && isEmpty ? pauseAtStart :
      speed;

    timer.current = window.setTimeout(next, delay) as unknown as number;

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [value, suggestions, i, pos, deleting]);

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={display}
      className={`w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 ${className}`}
      aria-label="Search products"
    />
  );
}
