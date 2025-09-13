import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedSearchInput from './AnimatedSearchInput';

type Props = {
  className?: string;
  suggestions?: string[];
};

export default function SearchBar({
  className = '',
  suggestions,
}: Props) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // Change this to whatever your search route expects
        navigate(`/products?query=${encodeURIComponent(q)}`);
      }}
      className={`w-full ${className}`}
    >
      <AnimatedSearchInput
        value={q}
        onChange={setQ}
        suggestions={suggestions ?? [
          'Search size: S+',
          'Search size: M+',
          'Search color: Black',
        //   'Try: price<999',
        ]}
      />
    </form>
  );
}
