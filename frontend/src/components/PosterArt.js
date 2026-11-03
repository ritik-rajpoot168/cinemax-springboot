import React from 'react';

const palettes = {
  Action: ['from-red-950', 'via-zinc-900', 'to-amber-700'],
  Adventure: ['from-emerald-950', 'via-slate-900', 'to-cyan-700'],
  Animation: ['from-fuchsia-900', 'via-sky-900', 'to-amber-500'],
  Biography: ['from-stone-900', 'via-zinc-800', 'to-yellow-700'],
  Comedy: ['from-yellow-700', 'via-rose-700', 'to-sky-700'],
  Crime: ['from-zinc-950', 'via-slate-900', 'to-red-900'],
  Drama: ['from-slate-950', 'via-indigo-950', 'to-zinc-700'],
  Family: ['from-sky-800', 'via-emerald-700', 'to-yellow-500'],
  Fantasy: ['from-violet-950', 'via-indigo-900', 'to-emerald-800'],
  History: ['from-stone-950', 'via-amber-950', 'to-red-900'],
  Horror: ['from-black', 'via-red-950', 'to-zinc-900'],
  Music: ['from-purple-950', 'via-rose-900', 'to-yellow-600'],
  Romance: ['from-rose-950', 'via-pink-900', 'to-orange-700'],
  'Sci-Fi': ['from-slate-950', 'via-blue-950', 'to-cyan-700'],
  Sport: ['from-green-950', 'via-emerald-900', 'to-lime-700'],
  Thriller: ['from-zinc-950', 'via-slate-900', 'to-orange-900'],
};

export default function PosterArt({ movie, className = '' }) {
  const primaryGenre = movie?.genre?.[0] || 'Drama';
  const palette = palettes[primaryGenre] || palettes.Drama;

  return (
    <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br ${palette.join(' ')} ${className}`}>
      <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_30%_20%,white,transparent_24%),radial-gradient(circle_at_80%_70%,white,transparent_18%)]" />
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />
      <div className="absolute -left-12 top-12 w-40 h-40 border border-white/20 rounded-full" />
      <div className="absolute right-6 bottom-28 w-24 h-24 border-4 border-white/10 rotate-45" />
      <div className="absolute left-5 right-5 top-5 flex justify-between text-[10px] uppercase tracking-[0.35em] text-white/60">
        <span>CineMax</span>
        <span>{movie?.ageRating || 'UA'}</span>
      </div>
      <div className="absolute inset-x-6 bottom-20">
        <div className="text-white/60 text-xs uppercase tracking-[0.25em] mb-3">{primaryGenre}</div>
        <div className="font-display text-white text-4xl leading-none drop-shadow-lg">
          {movie?.title}
        </div>
      </div>
      <div className="absolute inset-x-6 bottom-7 flex items-center justify-between text-xs text-white/70">
        <span>{movie?.language?.[0] || 'Cinema'}</span>
        <span>{movie?.duration ? `${movie.duration}m` : 'Soon'}</span>
      </div>
    </div>
  );
}
