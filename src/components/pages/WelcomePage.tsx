'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  FlaskConical,
  Globe,
  MapPin,
  Monitor,
  Package,
  Phone,
  ShieldCheck,
  Leaf,
  ScanLine,
  Truck,
  Recycle,
  Cog,
  Users,
  Award,
  TrendingUp,
  Zap,
  Target,
  HeartHandshake,
  Mail,
} from 'lucide-react';

interface WelcomePageProps {
  onEnterBackend: () => void;
}

const products = [
  { name: '特级透明颗粒', desc: '最高品质透明再生颗粒，纯净度极高', tag: 'PREMIUM', image: '/product-transparent.png', dotColor: 'bg-amber-400' },
  { name: '一级透明颗粒', desc: '优质透明颗粒，性价比优异', tag: 'GRADE A', image: '/product-white.png', dotColor: 'bg-green-400' },
  { name: '二级透明颗粒', desc: '经济型透明颗粒，满足一般品质需求', tag: 'GRADE B', image: '/product-white.png', dotColor: 'bg-green-400' },
  { name: '注塑透明（黑料）颗粒', desc: '专用注塑级颗粒，流动性能优异', tag: 'INJECTION', image: '/product-black.png', dotColor: 'bg-gray-400' },
  { name: '透明颗粒', desc: '通用型透明颗粒，品质可靠', tag: 'STANDARD', image: '/product-white.png', dotColor: 'bg-green-400' },
  { name: '奶白颗粒', desc: '色泽均匀的乳白色颗粒，遮盖力强', tag: 'MILKY', image: '/product-gray.png', dotColor: 'bg-white border border-gray-300' },
  { name: '花乙颗粒', desc: '聚乙烯混合料颗粒，综合性能优异', tag: 'MIXED PE', image: '/product-gray.png', dotColor: 'bg-white border border-gray-300' },
  { name: '蓝桶颗粒', desc: '蓝色桶料专用再生颗粒，色彩饱满稳定', tag: 'BLUE DRUM', image: '/product-blue.png', dotColor: 'bg-blue-400' },
];

const heroFeatures = [
  { icon: FlaskConical, text: '先进生产工艺' },
  { icon: ShieldCheck, text: '严格品质管控' },
  { icon: Leaf, text: '绿色环保材料' },
  { icon: Globe, text: '全球供应链' },
];

const heroStats = [
  { value: '15+', label: '年行业经验', desc: '深耕再生塑料领域' },
  { value: '50000+', label: '吨年产能', desc: '规模化生产保障' },
  { value: '300+', label: '服务客户', desc: '遍布全国各地' },
  { value: '98%', label: '纯度指标', desc: '行业领先品质' },
];

const advantages = [
  {
    icon: FlaskConical,
    title: '先进工艺',
    desc: '引进国际领先的清洗、分选、造粒生产线，确保每一粒产品都达到严苛品质标准',
    stats: [
      { value: '98%', label: '纯度指标' },
      { value: '99.5%', label: '合格率' },
    ],
    color: 'blue',
  },
  {
    icon: ScanLine,
    title: '严苛质检',
    desc: '全流程品质监控，从原料进厂到成品出厂，多道检测工序保障品质稳定可靠',
    stats: [
      { value: '12道', label: '检测工序' },
      { value: '24小时', label: '实时监控' },
    ],
    color: 'emerald',
  },
  {
    icon: Leaf,
    title: '绿色环保',
    desc: '践行可持续发展理念，循环再生降低碳排放，助力国家双碳目标实现',
    stats: [
      { value: '85%', label: '碳减排' },
      { value: '100%', label: '可回收' },
    ],
    color: 'teal',
  },
  {
    icon: Cog,
    title: '定制服务',
    desc: '根据客户需求提供个性化配方调整，满足不同应用场景的材料性能要求',
    stats: [
      { value: '50+', label: '配方方案' },
      { value: '7天', label: '快速交付' },
    ],
    color: 'orange',
  },
  {
    icon: Users,
    title: '专业团队',
    desc: '拥有经验丰富的技术研发团队，持续创新提升产品性能与品质',
    stats: [
      { value: '20+', label: '技术人员' },
      { value: '10年+', label: '平均经验' },
    ],
    color: 'violet',
  },
  {
    icon: Award,
    title: '品质认证',
    desc: '通过ISO质量管理体系认证，产品符合国家及行业标准要求',
    stats: [
      { value: 'ISO', label: '体系认证' },
      { value: '国标', label: '产品认证' },
    ],
    color: 'amber',
  },
];

const serviceFeatures = [
  { icon: Truck, title: '快速物流', desc: '全国配送网络，确保及时交付' },
  { icon: HeartHandshake, title: '售后保障', desc: '专业团队提供全程技术支持' },
  { icon: Target, title: '精准匹配', desc: '根据需求推荐最优产品方案' },
  { icon: Zap, title: '响应迅速', desc: '24小时内响应客户需求' },
];

const aboutFeatures = [
  { icon: ShieldCheck, title: '高品质保障', desc: '严格的质量管控体系' },
  { icon: Leaf, title: '环保可持续', desc: '绿色生产与可回收材料' },
  { icon: Package, title: '定制化服务', desc: '高度多样化的应用需求' },
  { icon: Globe, title: '全球供应', desc: '确定完全供应链体系' },
];

const contactItems = [
  { icon: MapPin, label: '公司地址', value: '湖南省衡阳市蒸湘区呆鹰岭镇同康七组', color: 'blue' },
  { icon: Phone, label: '联系电话', value: '17700293551（段）', color: 'emerald' },
  { icon: Mail, label: '电子邮箱', value: 'contact@xinderong.com', color: 'violet' },
  { icon: Clock, label: '营业时间', value: '周一至周六 8:00 - 18:00', color: 'amber' },
];

const navLinks = [
  { label: '首页', id: 'home' },
  { label: '产品中心', id: 'products' },
  { label: '核心优势', id: 'advantages' },
  { label: '关于我们', id: 'about' },
  { label: '联系我们', id: 'contact' },
] as const;

const springTransition = { type: 'spring' as const, stiffness: 100, damping: 20 };

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function RevealSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ ...springTransition, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ en, zh, icon: Icon, align = 'center' }: { en: string; zh: string; icon?: React.ElementType; align?: 'left' | 'center' }) {
  const isCenter = align === 'center';
  return (
    <div className={`mb-16 ${isCenter ? 'text-center' : 'text-left'}`}>
      <div className={`mb-4 flex items-center gap-3 ${isCenter ? 'justify-center' : ''}`}>
        <span className="h-px w-12 bg-zinc-300" />
        <span className="text-[11px] tracking-[0.3em] text-zinc-400 font-medium">{en}</span>
        <span className="h-px w-12 bg-zinc-300" />
      </div>
      <h2 className={`flex items-center gap-3 text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl ${isCenter ? 'justify-center' : ''}`}>
        {Icon && <Icon className="h-7 w-7 text-zinc-500" />}
        {zh}
      </h2>
    </div>
  );
}

function FloatingDot({ color, size = 6, className = '' }: { color: string; size?: number; className?: string }) {
  return (
    <motion.span
      className={`inline-block rounded-full ${color} ${className}`}
      style={{ width: size, height: size }}
      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function TypewriterText({ texts, className = '' }: { texts: string[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = texts[index];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayed.length < current.length) {
          setDisplayed(current.slice(0, displayed.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayed.length > 0) {
          setDisplayed(displayed.slice(0, -1));
        } else {
          setIsDeleting(false);
          setIndex((i) => (i + 1) % texts.length);
        }
      }
    }, isDeleting ? 50 : 100);
    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, index, texts]);

  return (
    <span className={className}>
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="ml-0.5 inline-block h-5 w-[2px] bg-current align-middle"
      />
    </span>
  );
}

function BreathingIndicator({ color = 'bg-emerald-400' }: { color?: string }) {
  return (
    <motion.span
      className={`inline-block h-2 w-2 rounded-full ${color}`}
      animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function ShimmerBar({ progress, color = 'bg-blue-500' }: { progress: number; color?: string }) {
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-200">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        whileInView={{ width: `${progress}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

function FloatingCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}

function ProductCard({ product, index }: { product: typeof products[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), springTransition);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), springTransition);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const xPos = (e.clientX - rect.left) / rect.width - 0.5;
    const yPos = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(xPos);
    y.set(yPos);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <RevealSection delay={index * 0.05}>
      <motion.div
        ref={cardRef}
        className="group cursor-pointer overflow-hidden rounded-2xl border border-zinc-200/60 bg-white transition-shadow duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)]"
        style={{
          rotateX,
          rotateY,
          transformPerspective: 1000,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ y: -8 }}
        transition={springTransition}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
          <motion.img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 via-transparent to-transparent"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className="absolute bottom-4 left-4 right-4"
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <span className="inline-flex items-center gap-1 text-xs font-medium text-white/90">
              查看详情
              <ArrowRight className="h-3 w-3" />
            </span>
          </motion.div>
        </div>
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <FloatingDot color={product.dotColor} size={8} />
            <motion.span
              className="text-[10px] font-semibold tracking-wider text-zinc-500"
              initial={{ opacity: 0.7 }}
              whileHover={{ opacity: 1 }}
            >
              {product.tag}
            </motion.span>
          </div>
          <h3 className="mb-2 text-base font-semibold text-zinc-900">{product.name}</h3>
          <p className="mb-4 text-sm leading-relaxed text-zinc-500">{product.desc}</p>
          <motion.span
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 transition-colors duration-200 group-hover:text-zinc-900"
            whileHover={{ x: 4 }}
          >
            了解更多
            <ArrowRight className="h-3 w-3" />
          </motion.span>
        </div>
      </motion.div>
    </RevealSection>
  );
}

function ContactCard({ item, index }: { item: typeof contactItems[0]; index: number }) {
  const colorMap: Record<string, { bg: string; icon: string; ring: string }> = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', ring: 'ring-blue-200' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-200' },
    violet: { bg: 'bg-violet-50', icon: 'text-violet-600', ring: 'ring-violet-200' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'ring-amber-200' },
  };
  const colors = colorMap[item.color] || colorMap.blue;

  return (
    <RevealSection delay={index * 0.1}>
      <motion.div
        className="group relative overflow-hidden rounded-[2rem] border border-zinc-200/60 bg-[#fafafa] p-8 transition-all duration-300"
        whileHover={{ y: -4, shadow: '0 20px 40px -15px rgba(0,0,0,0.08)' }}
        transition={springTransition}
      >
        <motion.div
          className={`absolute -right-8 -top-8 h-32 w-32 rounded-full ${colors.bg} opacity-50`}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative">
          <motion.div
            className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${colors.bg}`}
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
            transition={{ duration: 0.4 }}
          >
            <item.icon className={`h-5 w-5 ${colors.icon}`} />
          </motion.div>
          <h3 className="mb-2 text-sm font-semibold text-zinc-900">{item.label}</h3>
          <p className="text-sm leading-relaxed text-zinc-500">{item.value}</p>
        </div>
      </motion.div>
    </RevealSection>
  );
}

function AnimatedNumber({ value, suffix = '' }: { value: string; suffix?: string }) {
  const { ref, visible } = useReveal();
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const numValue = parseInt(value.replace(/[^0-9]/g, '')) || 0;
    const duration = 1500;
    const steps = 60;
    const increment = numValue / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numValue) {
        setDisplayValue(numValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [visible, value]);

  const prefix = value.match(/^[^0-9]*/)?.[0] || '';
  const displaySuffix = value.replace(/^[^0-9]*[0-9,]+/, '') || suffix;

  return (
    <span ref={ref}>
      {prefix}{displayValue.toLocaleString()}{displaySuffix}
    </span>
  );
}

function AboutFeatureCard({ item, index }: { item: typeof aboutFeatures[0]; index: number }) {
  return (
    <RevealSection delay={index * 0.08}>
      <motion.div
        className="group flex items-start gap-4"
        whileHover={{ x: 4 }}
        transition={springTransition}
      >
        <motion.div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white transition-all duration-200"
          whileHover={{ 
            borderColor: 'rgba(0,0,0,0.1)',
            backgroundColor: 'rgba(0,0,0,0.05)'
          }}
        >
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <item.icon className="h-5 w-5 text-zinc-600" />
          </motion.div>
        </motion.div>
        <div>
          <h3 className="mb-1 text-base font-semibold text-zinc-900">{item.title}</h3>
          <p className="text-sm leading-relaxed text-zinc-500">{item.desc}</p>
        </div>
      </motion.div>
    </RevealSection>
  );
}

export default function WelcomePage({ onEnterBackend }: WelcomePageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.6], [0, 80]);

  useEffect(() => {
    const sections = navLinks
      .map(link => document.getElementById(link.id))
      .filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver(
      entries => {
        const current = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (current?.target?.id) setActiveSection(current.target.id);
      },
      { threshold: [0.15, 0.25, 0.35, 0.5], rootMargin: '-15% 0px -50% 0px' }
    );
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fafafa] text-zinc-900">
      {/* Navigation */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/90 px-6 py-4 backdrop-blur-xl md:px-12">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <button onClick={() => scrollTo('home')} className="group flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto rounded-lg object-contain" />
          </button>

          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map(link => {
              const active = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className={`relative text-sm transition-colors duration-200 ${active ? 'font-medium text-white' : 'text-zinc-400 hover:text-white'}`}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute -bottom-5 left-0 h-[2px] w-full bg-white"
                      transition={springTransition}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onEnterBackend}
              className="hidden items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/80 px-5 py-2.5 text-xs font-medium text-zinc-200 backdrop-blur-sm transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-700/80 md:flex"
            >
              <Monitor className="h-3.5 w-3.5" />
              进入后台
            </button>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 text-zinc-300 lg:hidden"
              onClick={() => setMobileMenuOpen(v => !v)}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        <motion.div
          initial={false}
          animate={mobileMenuOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden lg:hidden"
        >
          <div className="mx-auto mt-4 max-w-[1400px] rounded-2xl border border-zinc-800 bg-zinc-900/95 p-4 backdrop-blur-xl">
            <div className="space-y-1">
              {navLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className={`block w-full rounded-xl px-4 py-3 text-left text-sm transition-colors ${activeSection === link.id ? 'bg-zinc-800 font-medium text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={onEnterBackend}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-zinc-900"
              >
                <Monitor className="h-4 w-4" />
                进入后台
              </button>
            </div>
          </div>
        </motion.div>
      </nav>

      <main className="relative z-10">
        {/* Hero - Enhanced Asymmetric Split Layout */}
        <section id="home" ref={heroRef} className="relative min-h-[100dvh] overflow-hidden bg-zinc-950 pt-20">
          <div className="absolute inset-0">
            <motion.div
              className="absolute inset-0"
              style={{
                backgroundImage: "url('/welcome-hero-bg.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                opacity: heroOpacity,
                y: heroY,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-zinc-950/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/70" />
          </div>

          <div className="relative mx-auto grid max-w-[1400px] min-h-[calc(100dvh-80px)] items-center px-6 md:grid-cols-[1.1fr_0.9fr] md:px-12">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springTransition, delay: 0.1 }}
              className="max-w-xl"
            >
              <motion.div
                className="mb-6 inline-flex items-center gap-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springTransition, delay: 0.3 }}
              >
                <span className="h-px w-8 bg-zinc-600" />
                <span className="text-[11px] tracking-[0.3em] text-zinc-500 font-medium">QUALITY MATERIALS, INFINITE POSSIBILITIES</span>
              </motion.div>

              <motion.h1
                className="mb-4 text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-5xl lg:text-[3.5rem]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springTransition, delay: 0.4 }}
              >
                衡阳鑫德荣
                <br />
                新材料科技有限公司
              </motion.h1>

              <motion.div
                className="mb-4 h-8 text-lg text-zinc-300 md:text-xl"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springTransition, delay: 0.5 }}
              >
                <TypewriterText
                  texts={['专业塑料颗粒解决方案提供商', '高品质再生材料制造商', '绿色环保材料倡导者']}
                />
              </motion.div>

              <motion.p
                className="mb-6 max-w-md text-sm leading-relaxed text-zinc-500"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springTransition, delay: 0.6 }}
              >
                我们致力于研发、生产高品质高性能塑料颗粒，
                为全球客户提供创新、环保、可信赖的材料解决方案。
              </motion.p>

              <motion.div
                className="mb-8 flex flex-wrap gap-3"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springTransition, delay: 0.65 }}
              >
                {heroFeatures.map((feature, i) => (
                  <motion.div
                    key={feature.text}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-700/50 bg-zinc-800/30 px-3 py-1.5 text-xs text-zinc-400"
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(39, 39, 42, 0.5)' }}
                  >
                    <feature.icon className="h-3 w-3" />
                    {feature.text}
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                className="flex items-center gap-4"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springTransition, delay: 0.7 }}
              >
                <button
                  onClick={() => scrollTo('products')}
                  className="group inline-flex items-center gap-3 border border-zinc-600 bg-transparent px-8 py-3.5 text-sm font-medium text-white transition-all duration-200 hover:border-zinc-400 hover:bg-zinc-800/50 active:scale-[0.98]"
                >
                  了解更多
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
                <button
                  onClick={onEnterBackend}
                  className="inline-flex items-center gap-2 bg-white px-6 py-3.5 text-sm font-medium text-zinc-900 transition-all duration-200 hover:bg-zinc-100 active:scale-[0.98]"
                >
                  <Monitor className="h-4 w-4" />
                  进入后台
                </button>
              </motion.div>
            </motion.div>

            <motion.div
              className="hidden md:flex md:items-center md:justify-end"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springTransition, delay: 0.5 }}
            >
              <div className="grid grid-cols-2 gap-4">
                {heroStats.map((stat, i) => (
                  <FloatingCard key={stat.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm">
                    <div className="mb-2 flex items-center gap-2">
                      <BreathingIndicator />
                      <span className="text-[10px] text-zinc-500">{stat.desc}</span>
                    </div>
                    <div className="text-2xl font-bold tracking-tight text-white">{stat.value}</div>
                    <div className="mt-1 text-[11px] text-zinc-500">{stat.label}</div>
                  </FloatingCard>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="flex h-10 w-6 items-start justify-center rounded-full border border-zinc-700 pt-2">
              <motion.div
                className="h-2 w-0.5 rounded-full bg-zinc-500"
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        </section>

        {/* Products - Enhanced Bento Grid with 3D Cards */}
        <section id="products" className="bg-[#fafafa] py-24 md:py-32">
          <div className="mx-auto max-w-[1400px] px-6 md:px-12">
            <SectionLabel en="PRODUCT CENTER" zh="产品中心" icon={Package} />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" style={{ perspective: '1000px' }}>
              {products.map((product, index) => (
                <ProductCard key={product.name} product={product} index={index} />
              ))}
            </div>

            <motion.div
              className="mt-12 flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...springTransition, delay: 0.3 }}
            >
              <motion.button
                className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-8 py-3 text-sm font-medium text-zinc-700 transition-all duration-200 hover:border-zinc-400 hover:bg-zinc-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                查看全部产品
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.div>
          </div>
        </section>

        {/* Advantages - Enhanced Bento Grid */}
        <section id="advantages" className="bg-white py-24 md:py-32">
          <div className="mx-auto max-w-[1400px] px-6 md:px-12">
            <SectionLabel en="CORE ADVANTAGES" zh="核心优势" icon={ShieldCheck} />

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {advantages.map((item, index) => {
                const colorMap: Record<string, { bg: string; icon: string; bar: string; text: string }> = {
                  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', bar: 'bg-blue-500', text: 'text-blue-600' },
                  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', bar: 'bg-emerald-500', text: 'text-emerald-600' },
                  teal: { bg: 'bg-teal-50', icon: 'text-teal-600', bar: 'bg-teal-500', text: 'text-teal-600' },
                  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', bar: 'bg-orange-500', text: 'text-orange-600' },
                  violet: { bg: 'bg-violet-50', icon: 'text-violet-600', bar: 'bg-violet-500', text: 'text-violet-600' },
                  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', bar: 'bg-amber-500', text: 'text-amber-600' },
                };
                const colors = colorMap[item.color] || colorMap.blue;

                return (
                  <RevealSection key={item.title} delay={index * 0.08}>
                    <motion.div
                      className="group h-full rounded-[2rem] border border-zinc-200/60 bg-[#fafafa] p-8 transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)]"
                      whileHover={{ y: -4 }}
                      transition={springTransition}
                    >
                      <motion.div
                        className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white transition-transform duration-300"
                        whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.4 }}
                      >
                        <item.icon className={`h-7 w-7 ${colors.icon}`} />
                      </motion.div>
                      <h3 className="mb-3 text-xl font-semibold text-zinc-900">{item.title}</h3>
                      <p className="mb-6 text-sm leading-relaxed text-zinc-500">{item.desc}</p>
                      <div className="space-y-4">
                        {item.stats.map((stat, i) => (
                          <div key={stat.label}>
                            <div className="mb-2 flex items-baseline justify-between">
                              <span className="text-2xl font-bold tracking-tight text-zinc-900">{stat.value}</span>
                              <span className="text-xs text-zinc-400">{stat.label}</span>
                            </div>
                            <ShimmerBar progress={85 + i * 5} color={colors.bar} />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </RevealSection>
                );
              })}
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {serviceFeatures.map((item, i) => (
                <RevealSection key={item.title} delay={i * 0.06}>
                  <motion.div
                    className="group flex items-start gap-4 rounded-2xl border border-zinc-200/60 bg-white p-6 transition-all duration-300"
                    whileHover={{ y: -4, shadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}
                  >
                    <motion.div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 transition-colors duration-200"
                      whileHover={{ backgroundColor: 'rgb(24 24 27)' }}
                    >
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <item.icon className="h-5 w-5 text-zinc-600 transition-colors duration-200 group-hover:text-white" />
                      </motion.div>
                    </motion.div>
                    <div>
                      <h3 className="mb-1 text-base font-semibold text-zinc-900">{item.title}</h3>
                      <p className="text-sm leading-relaxed text-zinc-500">{item.desc}</p>
                    </div>
                  </motion.div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* About - Enhanced Split Layout */}
        <section id="about" className="bg-[#fafafa] py-24 md:py-32">
          <div className="mx-auto max-w-[1200px] px-6 md:px-12">
            <div className="grid items-center gap-16 md:grid-cols-[1fr_1.1fr]">
              <RevealSection>
                <div className="mb-6 flex items-center gap-3">
                  <span className="h-px w-12 bg-zinc-300" />
                  <span className="text-[11px] tracking-[0.3em] text-zinc-400 font-medium">ABOUT US</span>
                </div>
                <h2 className="mb-6 flex items-center gap-3 text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
                  <Building2 className="h-7 w-7 text-zinc-500" />
                  关于我们
                </h2>
                <p className="mb-8 text-base leading-relaxed text-zinc-600">
                  衡阳鑫德荣新材料科技有限公司是一家专注于再生塑料颗粒研发与生产的高新技术企业。
                  公司拥有先进的生产设备和完善的质检体系，致力于为客户提供高品质、环保型的塑料材料解决方案。
                </p>
                <div className="grid grid-cols-3 gap-8">
                  {[
                    { value: '15+', label: '年行业经验' },
                    { value: '50000+', label: '吨年产能' },
                    { value: '300+', label: '服务客户' },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ ...springTransition, delay: i * 0.1 }}
                    >
                      <div className="text-2xl font-bold tracking-tight text-zinc-900">
                        <AnimatedNumber value={stat.value} />
                      </div>
                      <div className="mt-1 text-[11px] text-zinc-400">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </RevealSection>

              <RevealSection delay={0.15}>
                <motion.div
                  className="relative overflow-hidden rounded-[2rem] bg-zinc-200"
                  whileHover={{ scale: 1.02 }}
                  transition={springTransition}
                >
                  <img
                    src="/factory.png"
                    alt="厂区图片"
                    className="h-full w-full object-cover"
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-zinc-900/20 to-transparent"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>
              </RevealSection>
            </div>

            <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {aboutFeatures.map((item, i) => (
                <AboutFeatureCard key={item.title} item={item} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* Contact - Enhanced Cards with Animations */}
        <section id="contact" className="bg-white py-24 md:py-32">
          <div className="mx-auto max-w-[1200px] px-6 md:px-12">
            <SectionLabel en="CONTACT US" zh="联系我们" icon={Phone} />

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {contactItems.map((item, i) => (
                <ContactCard key={item.label} item={item} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-800/50 bg-zinc-950 py-12">
          <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 px-6 md:flex-row md:px-12">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-8 w-auto rounded object-contain" />
              <span className="text-sm font-medium text-zinc-500">衡阳鑫德荣新材料科技有限公司</span>
            </div>
            <p className="text-[11px] text-zinc-600">© 2026 衡阳鑫德荣新材料科技有限公司 版权所有</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
