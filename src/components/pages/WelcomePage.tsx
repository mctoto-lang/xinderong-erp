'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Shield, TrendingUp } from 'lucide-react';
import { COMPANY_NAME, COMPANY_SUBTITLE } from '@/lib/constants';
import { useAppStore } from '@/lib/store';

const features = [
  { icon: Zap, label: '智能生产', desc: '精益管理，降本增效' },
  { icon: TrendingUp, label: '数据洞察', desc: '科学决策，精准预测' },
  { icon: Sparkles, label: '供应链协同', desc: '高效流转，实时联动' },
  { icon: Shield, label: '品质追溯', desc: '全程可控，质量保障' },
];

const stats = [
  { value: 10, suffix: '+', label: '年行业深耕' },
  { value: 500, suffix: '+', label: '合作伙伴' },
  { value: 99.9, suffix: '%', label: '系统稳定性' },
];

function FloatingParticles() {
  const [mounted, setMounted] = useState(false);
  
  const particles = useMemo(() => {
    if (typeof window === 'undefined') return [];
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
    }));
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.5, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(value, increment * step);
      setCount(current);
      if (step >= steps) {
        setCount(value);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, value]);

  return (
    <div ref={ref} className="tabular-nums">
      {value % 1 === 0 ? Math.floor(count) : count.toFixed(1)}
      {suffix}
    </div>
  );
}

function TypeWriter({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayText, setDisplayText] = useState('');
  const [started, setStarted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const startTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimer);
  }, [delay, mounted]);

  useEffect(() => {
    if (!started || !mounted) return;

    let currentIndex = 0;
    const timer = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(timer);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [started, text, mounted]);

  if (!mounted) {
    return <span>{text}</span>;
  }

  return (
    <span>
      {displayText}
      {displayText.length < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-0.5 h-5 md:h-6 bg-white/60 ml-1 align-middle"
        />
      )}
    </span>
  );
}

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-100, 100], [10, -10]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-10, 10]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 + index * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, perspective: 1000 }}
      className="group relative cursor-pointer"
    >
      <div className="relative p-6 md:p-8 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm transition-all duration-500 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_0_40px_rgba(255,255,255,0.05)]">
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />
        <div className="relative z-10">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 md:mb-6 group-hover:bg-white/10 transition-colors"
          >
            <Icon className="w-5 h-5 md:w-6 md:h-6 text-white/60 group-hover:text-white transition-colors" />
          </motion.div>
          <h3 className="text-base md:text-lg font-medium tracking-wide mb-2 group-hover:text-white transition-colors">
            {feature.label}
          </h3>
          <p className="text-xs md:text-sm text-white/40 leading-relaxed group-hover:text-white/60 transition-colors">
            {feature.desc}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function MouseGlow() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-10"
      style={{
        background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.03), transparent 40%)`,
      }}
    />
  );
}

export default function WelcomePage() {
  const setShowWelcome = useAppStore((state) => state.setShowWelcome);

  const handleEnter = () => {
    setShowWelcome(false);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <FloatingParticles />
      <MouseGlow />

      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '100px 100px',
          }}
        />
      </div>

      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[100px]"
      />
      <motion.div
        animate={{
          opacity: [0.2, 0.5, 0.2],
          scale: [1.1, 1, 1.1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-white/[0.015] rounded-full blur-[120px]"
      />

      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        onClick={handleEnter}
        className="fixed top-6 md:top-8 right-6 md:right-8 z-50 group"
      >
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-white/10"
          />
          <div className="relative flex items-center gap-3 px-6 py-3 bg-white/[0.05] border border-white/20 rounded-full text-white/70 hover:text-white hover:bg-white/10 hover:border-white/40 transition-all duration-500 backdrop-blur-sm">
            <span className="text-xs font-medium tracking-[0.15em] uppercase">进入系统</span>
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          </div>
        </div>
      </motion.button>

      <div className="relative z-20 min-h-screen flex flex-col px-6 md:px-12 lg:px-20 xl:px-32">
        <div className="flex-1 flex items-center">
          <div className="max-w-7xl mx-auto w-full py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="mb-16 md:mb-24"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 80 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="h-px bg-gradient-to-r from-white/50 to-transparent mb-8 md:mb-12"
            />

            <div className="overflow-hidden mb-4 md:mb-6">
              <motion.h1
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extralight tracking-tight leading-tight"
              >
                <span>衡阳鑫德荣新材料</span>
                <br />
                <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">科技有限公司</span>
              </motion.h1>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-16 md:mb-24 max-w-2xl"
          >
            <p className="text-sm md:text-base lg:text-lg text-white/50 font-light leading-loose md:leading-relaxed">
              <TypeWriter
                text="以创新科技为驱动，以卓越品质为基石，致力于成为新材料领域的行业领军者。数字化赋能传统产业，构建智慧工厂新生态。"
                delay={800}
              />
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-16 md:mb-24">
            {features.map((feature, index) => (
              <FeatureCard key={feature.label} feature={feature} index={index} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="flex flex-wrap items-center gap-8 md:gap-16 lg:gap-24"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 + index * 0.1, duration: 0.6 }}
                className="group"
              >
                <div className="text-3xl md:text-4xl lg:text-5xl font-extralight tracking-tight text-white/90 group-hover:text-white transition-colors">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-[10px] md:text-xs text-white/30 tracking-wider mt-1 md:mt-2 group-hover:text-white/50 transition-colors">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
          </div>
        </div>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.8 }}
          className="relative z-30 mt-auto pt-8 pb-6 md:pb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
        >
          <p className="text-[10px] md:text-xs text-white/20 tracking-wide">
            © {new Date().getFullYear()} {COMPANY_NAME}
          </p>
          <p className="text-[10px] md:text-xs text-white/20 tracking-wide">
            All Rights Reserved · Privacy Policy
          </p>
        </motion.footer>
      </div>

      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.5, duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed left-6 md:left-12 lg:left-20 xl:left-32 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent origin-top"
      />

      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.7, duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed right-6 md:right-12 lg:right-20 xl:right-32 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent origin-top"
      />
    </div>
  );
}
