'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Factory, TrendingUp, Shield, Globe } from 'lucide-react';
import { COMPANY_NAME, COMPANY_SUBTITLE } from '@/lib/constants';
import { useAppStore } from '@/lib/store';

const features = [
  {
    icon: Factory,
    title: '智能制造',
    description: '全流程数字化生产管理，实现精益生产与高效运营',
  },
  {
    icon: TrendingUp,
    title: '数据驱动',
    description: '实时数据分析与可视化，赋能科学决策与战略规划',
  },
  {
    icon: Shield,
    title: '安全可靠',
    description: '企业级数据安全保障，多重防护确保信息无忧',
  },
  {
    icon: Globe,
    title: '全球视野',
    description: '立足本土，放眼全球，打造行业标杆企业',
  },
];

const stats = [
  { value: '10+', label: '行业深耕' },
  { value: '500+', label: '合作伙伴' },
  { value: '99.9%', label: '系统稳定' },
  { value: '24/7', label: '技术支持' },
];

export default function WelcomePage() {
  const setShowWelcome = useAppStore((state) => state.setShowWelcome);
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Array<{ x: number; y: number; duration: number }>>([]);

  useEffect(() => {
    setMounted(true);
    setParticles(
      Array.from({ length: 20 }, () => ({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        duration: Math.random() * 3 + 2,
      }))
    );
  }, []);

  const handleEnter = () => {
    setShowWelcome(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        {/* Floating particles */}
        {mounted && particles.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            initial={{ x: particle.x, y: particle.y }}
            animate={{ y: [null, Math.random() * -200], opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: particle.duration, repeat: Infinity, repeatType: 'loop' }}
          />
        ))}
      </div>

      {/* Enter button - top right */}
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        onClick={handleEnter}
        className="fixed top-6 right-6 z-50 group flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/80 hover:text-white hover:bg-white/20 hover:border-white/40 transition-all duration-300 hover:shadow-lg hover:shadow-white/10"
      >
        <span className="text-sm font-medium tracking-wide">进入系统</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </motion.button>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-20">
        {/* Logo and title section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 mb-8 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-2xl shadow-blue-500/30"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight"
          >
            {COMPANY_NAME}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg md:text-xl text-white/60 font-light tracking-wide"
          >
            {COMPANY_SUBTITLE}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-8 mx-auto w-32 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
          />
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="max-w-3xl text-center mb-16"
        >
          <p className="text-base md:text-lg text-white/70 leading-relaxed">
            以<span className="text-cyan-400 font-medium">创新科技</span>为驱动，以<span className="text-cyan-400 font-medium">卓越品质</span>为基石，
            致力于成为新材料领域的<span className="text-cyan-400 font-medium">行业领军者</span>。
            我们以数字化赋能传统产业，构建智慧工厂新生态，引领绿色可持续发展未来。
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full mb-16"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
              className="group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-colors">
                <feature.icon className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="flex flex-wrap justify-center gap-8 md:gap-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.3 + index * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-white/40">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="absolute bottom-6 left-0 right-0 text-center"
        >
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} {COMPANY_NAME} · 版权所有
          </p>
        </motion.div>
      </div>
    </div>
  );
}
