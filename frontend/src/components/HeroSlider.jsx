import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const SLIDES = [
  { image: "/hero_mug.png", tag: "Premium Mugs", title: "BOLD MOVES\nSTART HERE", sub: "Personalized Cups with stunning quality", cta: "Shop Now", link: "/products?category=Cup", accent: "text-white border-white" },
  { image: "/hero_shirt.png", tag: "Custom Apparels", title: "WEAR YOUR\nATTITUDE", sub: "High quality custom graphic t-shirts", cta: "Explore Apparels", link: "/products?category=T-Shirt", accent: "text-white border-white" },
  { image: "/hero_diary.png", tag: "Corporate Gifts", title: "MAKE AN\nIMPRESSION", sub: "Premium diaries and pens for your business", cta: "View Corporate", link: "/products?category=Diary", accent: "text-white border-white" },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const t = setInterval(() => go((current + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, [current]);

  const go = (idx) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => { setCurrent(idx); setAnimating(false); }, 300);
  };

  const slide = SLIDES[current];

  return (
    <div className={`relative min-h-[400px] md:min-h-[550px] flex items-center overflow-hidden transition-opacity duration-500 ${animating ? "opacity-50" : "opacity-100"}`} style={{ backgroundImage: `url(${slide.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />
      {/* Decorative large circles (simulating background objects) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-white/5 -top-40 -left-20" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-black/10 bottom-10 left-40" />
      </div>

      <div className="max-w-7xl mx-auto w-full px-12 relative z-10 flex justify-end">
        {/* Content on the right */}
        <div className="max-w-xl text-right">
          <h1 className="text-white text-2xl md:text-5xl font-black leading-none uppercase italic tracking-tighter" style={{ textShadow: '2px 4px 10px rgba(0,0,0,0.3)' }}>
            {slide.title.split("\n").map((line, i) => (
              <span key={i} className="block">{line}</span>
            ))}
          </h1>
          <p className="text-white mt-2 md:mt-6 text-xs md:text-2xl font-bold uppercase tracking-widest bg-red-700/80 inline-block px-2 py-0.5 md:px-4 md:py-1" style={{ textShadow: '1px 2px 4px rgba(0,0,0,0.3)' }}>
            {slide.tag}
          </p>
          <div className="mt-4 md:mt-8 flex justify-end">
            <Link to={slide.link} className={`inline-flex border-2 px-4 py-1.5 text-xs md:px-8 md:py-3 font-black uppercase md:text-base tracking-wider hover:bg-white hover:text-black transition-all duration-300 ${slide.accent}`}>
              {slide.cta} →
            </Link>
          </div>
        </div>
      </div>

      {/* Prominent Arrows */}
      <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white border-none bg-transparent flex items-center justify-center text-6xl md:text-8xl z-20 font-light cursor-pointer transition-all hover:scale-110" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.4)' }} onClick={() => go((current - 1 + SLIDES.length) % SLIDES.length)}>‹</button>
      <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white border-none bg-transparent flex items-center justify-center text-6xl md:text-8xl z-20 font-light cursor-pointer transition-all hover:scale-110" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.4)' }} onClick={() => go((current + 1) % SLIDES.length)}>›</button>

      {/* Progress Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => go(i)} className={`h-1 rounded-none border-none cursor-pointer transition-all duration-500 ${i === current ? "w-12 bg-white" : "w-6 bg-white/30"}`} />
        ))}
      </div>
    </div>
  );
}
