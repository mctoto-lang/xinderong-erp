'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { COMPANY_NAME, COMPANY_SUBTITLE } from '@/lib/constants';
import { useAppStore } from '@/lib/store';

const features = [
  { label: '智能生产', desc: '精益管理' },
  { label: '数据洞察', desc: '科学决策' },
  { label: '供应链协同', desc: '高效流转' },
  { label: '品质追溯', desc: '全程可控' },
];

const stats = [
  { value: '10+', label: 'Years' },
  { value: '500+', label: 'Partners' },
  { value: '99.9%', label: 'Uptime' },
];

export default function WelcomePage() {
  const setShowWelcome = useAppStore((state) => state.setShowWelcome);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEnter = () => {
    setShowWelcome(false);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      />

      {/* Gradient overlays */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-white/[0.03] to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-white/[0.02] to-transparent rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      {/* Enter button - top right */}
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        onClick={handleEnter}
        className="fixed top-8 right-8 z-50 group flex items-center gap-3 px-6 py-3 bg-transparent border border-white/20 rounded-full text-white/70 hover:text-white hover:border-white/40 transition-all duration-500"
      >
        <span className="text-xs font-light tracking-[0.2em] uppercase">Enter</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
      </motion.button>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-6xl mx-auto w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="mb-20"
          >
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="w-12 h-px bg-white/30 mb-8 origin-left"
            />
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tight mb-4">
              {COMPANY_NAME}
            </h1>
            <p className="text-lg md:text-xl text-white/40 font-light tracking-wide">
              {COMPANY_SUBTITLE}
            </p>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-24 max-w-2xl"
          >
            <p className="text-base md:text-lg text-white/50 font-light leading-relaxed">
              以<span className="text-white/80">创新科技</span>为驱动，以<span className="text-white/80">卓越品质</span>为基石，
              致力于成为新材料领域的<span className="text-white/80">行业领军者</span>。
              数字化赋能传统产业，构建智慧工厂新生态。
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-24"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="group cursor-default"
              >
                <div className="flex items-center gap-2 mb-2">
                  <ChevronRight className="w-3 h-3 text-white/30 group-hover:text-white/60 transition-colors" />
                  <span className="text-sm font-medium tracking-wide">{feature.label}</span>
                </div>
                <p className="text-xs text-white/30 pl-5">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex items-center gap-16"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
                className="text-left"
              >
                <div className="text-3xl md:text-4xl font-light tracking-tight text-white/90">
                  {stat.value}
                </div>
                <div className="text-[10px] text-white/30 tracking-[0.2em] uppercase mt-1">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-8 left-8 md:left-16 lg:left-24 right-8 md:right-16 lg:right-24 flex justify-between items-center"
        >
          <p className="text-[10px] text-white/20 tracking-wide">
            © {new Date().getFullYear()} {COMPANY_NAME}
          </p>
          <p className="text-[10px] text-white/20 tracking-wide">
            All Rights Reserved
          </p>
        </motion.div>
      </div>

      {/* Decorative line */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.5, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="fixed left-8 md:left-16 lg:left-24 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent origin-top"
      />
    </div>
  );
}
