'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Phone, Box, ArrowRight, Diamond, Gem, Package, Container,
  Droplets, CircleDot, Sparkles, PaintBucket, Layers, Building2,
  ShieldCheck, Recycle, Truck, Headphones, FlaskConical,
  ScanLine, Leaf, Terminal, MapPin, Clock, ChevronDown,
  CheckCircle, Hexagon, Menu, X, Monitor
} from 'lucide-react';

interface WelcomePageProps {
  onEnterBackend: () => void;
}

const products = [
  { name: '特级透明颗粒', desc: '最高品质透明再生颗粒，纯净度极高，适用于高端注塑及吹膜制品', tag: 'PREMIUM', tagClass: 'border-gold-400/30 text-gold-400', colorClass: 'color-clear', shadow: '0 4px 15px rgba(255,255,255,0.1)', feature: '高透光率 · 高纯度' },
  { name: '一级透明颗粒', desc: '优质透明颗粒，性价比优异，广泛用于日用品及包装材料生产', tag: 'GRADE A', tagClass: 'border-zinc-700 text-zinc-400', colorClass: 'color-clear', shadow: '0 4px 15px rgba(255,255,255,0.08)', feature: '均匀稳定 · 高性价比' },
  { name: '二级透明颗粒', desc: '经济型透明颗粒，满足一般品质需求，适用于工业级产品制造', tag: 'GRADE B', tagClass: 'border-zinc-700 text-zinc-400', colorClass: 'color-clear', shadow: '0 4px 15px rgba(200,200,200,0.06)', feature: '经济实用 · 量大从优' },
  { name: '注塑透明（黑料）颗粒', desc: '专用注塑级颗粒，流动性能优异，适配各类注塑成型工艺', tag: 'INJECTION', tagClass: 'border-gold-400/30 text-gold-400', colorClass: 'color-black', shadow: '', feature: '高流动性 · 注塑专用' },
  { name: '透明颗粒', desc: '通用型透明颗粒，品质可靠，适配多种加工方式与制品需求', tag: 'STANDARD', tagClass: 'border-zinc-700 text-zinc-400', colorClass: 'color-clear', shadow: '0 4px 15px rgba(255,255,255,0.06)', feature: '通用型 · 品质可靠' },
  { name: '奶白颗粒', desc: '色泽均匀的乳白色颗粒，遮盖力强，广泛用于白色制品生产', tag: 'MILKY', tagClass: 'border-zinc-700 text-zinc-400', colorClass: 'color-milky', shadow: '', feature: '色泽均匀 · 遮盖力强' },
  { name: '花乙颗粒', desc: '聚乙烯混合料颗粒，综合性能优异，适用于管材、板材等制品', tag: 'MIXED PE', tagClass: 'border-zinc-700 text-zinc-400', colorClass: 'color-multi', shadow: '', feature: 'PE混合料 · 综合性能优' },
  { name: '蓝桶颗粒', desc: '蓝色桶料专用再生颗粒，色彩饱满稳定，适配吹塑及注塑工艺', tag: 'BLUE DRUM', tagClass: 'border-zinc-700 text-zinc-400', colorClass: 'color-blue', shadow: '', feature: '色彩稳定 · 桶料专用' },
];

const advantages = [
  { icon: FlaskConical, title: '先进工艺', desc: '引进国际领先的清洗、分选、造粒生产线，确保每一粒产品都达到严苛品质标准', label: '纯度指标', value: '98%', percent: 98 },
  { icon: ScanLine, title: '严苛质检', desc: '全流程品质监控，从原料进厂到成品出厂，多道检测工序保障品质稳定', label: '合格率', value: '99.5%', percent: 99.5 },
  { icon: Leaf, title: '绿色环保', desc: '践行可持续发展理念，循环再生降低碳排放，助力国家双碳目标实现', label: '碳减排', value: '85%', percent: 85 },
];

const contactInfo = [
  { icon: MapPin, label: '公司地址', value: '湖南省衡阳市蒸湘区呆鹰岭镇同康七组' },
  { icon: Phone, label: '联系电话', value: '17700293551（段）' },
  { icon: Clock, label: '营业时间', value: '周一至周六 8:00 - 18:00' },
];

const features = [
  { icon: ShieldCheck, text: '品质保障' },
  { icon: Recycle, text: '绿色循环' },
  { icon: Truck, text: '快速交付' },
  { icon: Headphones, text: '专属服务' },
];

const techSpecs = [
  { value: '±0.02', label: 'MFI偏差范围' },
  { value: '≤0.1%', label: '含水率' },
  { value: '2-5mm', label: '颗粒尺寸' },
  { value: '24h', label: '响应时效' },
];

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: { x: number; y: number; size: number; speedX: number; speedY: number; opacity: number; reset: () => void; update: () => void; draw: () => void }[] = [];

    function resizeCanvas() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particleCount = Math.min(80, Math.floor(window.innerWidth / 15));

    class Particle {
      x: number; y: number; size: number; speedX: number; speedY: number; opacity: number;
      constructor() {
        this.x = 0; this.y = 0; this.size = 0; this.speedX = 0; this.speedY = 0; this.opacity = 0;
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 1.5 + 0.3;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.4 + 0.1;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas!.width || this.y < 0 || this.y > canvas!.height) {
          this.reset();
        }
      }
      draw() {
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(212, 175, 55, ${this.opacity})`;
        ctx!.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `rgba(212, 175, 55, ${0.03 * (1 - dist / 150)})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }
    }

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      particles.forEach(p => { p.update(); p.draw(); });
      drawConnections();
      animationId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none" />;
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function RevealSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}
    >
      {children}
    </div>
  );
}

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let current = 0;
    const increment = target / 60;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setCount(Math.floor(current));
    }, 25);
    return () => clearInterval(timer);
  }, [target]);

  return <>{count}{suffix}</>;
}

function ProgressBar({ percent }: { percent: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-[1500ms] ease-out"
        style={{ width: visible ? `${percent}%` : '0%' }}
      />
    </div>
  );
}

function useTypewriter(text: string, speed = 80, startDelay = 800) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
        } else {
          setDone(true);
          clearInterval(interval);
        }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [text, speed, startDelay]);

  return { displayed, done };
}

function TypewriterP({ text, speed = 80, startDelay = 800, className = '' }: { text: string; speed?: number; startDelay?: number; className?: string }) {
  const { displayed, done } = useTypewriter(text, speed, startDelay);
  return (
    <p className={className}>
      {displayed}
      {!done && <span className="inline-block w-[2px] h-[1em] bg-gold-400 ml-0.5 align-middle animate-pulse" />}
    </p>
  );
}

export default function WelcomePage({ onEnterBackend }: WelcomePageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  }, []);

  const navLinks = [
    { label: '首页', id: 'home' },
    { label: '产品中心', id: 'products' },
    { label: '关于我们', id: 'about' },
    { label: '核心优势', id: 'advantages' },
    { label: '联系我们', id: 'contact' },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] font-['Noto_Sans_SC','Inter',sans-serif] overflow-x-hidden"
      style={{
        backgroundImage: 'linear-gradient(rgba(212,175,55,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }}
    >
      <ParticleCanvas />

      <div className="fixed top-0 left-0 right-0 h-0.5 z-[1] pointer-events-none animate-[scanline_8s_linear_infinite]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent)' }}
      />

      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[rgba(9,9,11,0.95)] border-b-[rgba(212,175,55,0.15)]' : 'bg-[rgba(9,9,11,0.8)] border-b-[rgba(212,175,55,0.08)]'}`}
        style={{ backdropFilter: 'blur(12px)', borderBottomWidth: '1px' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <Hexagon className="w-5 h-5 text-[#09090B]" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-base font-semibold text-white tracking-wide">鑫德荣</span>
              <span className="text-[10px] text-gold-400 block -mt-0.5 tracking-widest">XINDERONG</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <button key={link.id} onClick={() => scrollTo(link.id)}
                className="nav-link group relative px-4 py-2 text-sm text-zinc-300 transition-all duration-300">
                <span className="relative z-10">{link.label}</span>
                <span className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden">
                  <span 
                    className="nav-underline block h-full origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                    style={{ background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }}
                  />
                </span>
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onEnterBackend}
              className="btn-enter-backend inline-flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-medium"
            >
              <Monitor className="w-4 h-4" />
              进入后台
            </button>
          </div>

          <button className="md:hidden p-2 text-zinc-400 hover:text-gold-400 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gold-400/10 bg-[rgba(9,9,11,0.95)]" style={{ backdropFilter: 'blur(12px)' }}>
            <div className="px-6 py-4 space-y-1">
              {navLinks.map(link => (
                <button key={link.id} onClick={() => scrollTo(link.id)}
                  className="block w-full text-left px-4 py-3 text-sm text-zinc-300 hover:text-gold-400 hover:bg-gold-400/5 rounded-lg transition-all">
                  {link.label}
                </button>
              ))}
              <button onClick={onEnterBackend}
                className="block w-full text-left px-4 py-3 text-sm text-gold-400 hover:bg-gold-400/5 rounded-lg transition-all">
                进入后台
              </button>
            </div>
          </div>
        )}
      </nav>

      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full border border-zinc-600/20 animate-[rotate-slow_20s_linear_infinite]" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full border border-zinc-500/30 animate-[rotate-reverse_15s_linear_infinite]" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-[200px] h-[200px] md:w-[300px] md:h-[300px] rounded-full border border-gold-400/10 animate-[pulse-gold_3s_ease-in-out_infinite]" />
        </div>

        <div className="absolute top-20 left-8 md:left-16 pointer-events-none opacity-20">
          <div className="w-20 h-20 border-l-2 border-t-2 border-gold-400/40" />
        </div>
        <div className="absolute bottom-20 right-8 md:right-16 pointer-events-none opacity-20">
          <div className="w-20 h-20 border-r-2 border-b-2 border-gold-400/40" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-gold-400/30 bg-gold-400/[0.08] text-gold-400">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
              新材料科技 · 塑造未来
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
            <span className="text-white">衡阳鑫德荣</span><br />
            <span 
              className="text-gold-gradient"
              style={{
                background: 'linear-gradient(135deg, #E8D48B, #D4AF37, #B8962E)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.4)) drop-shadow(0 0 30px rgba(212,175,55,0.2))'
              }}
            >
              新材料科技
            </span>
          </motion.h1>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-6 text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            <TypewriterP
              text="专注高品质再生塑料颗粒研发与生产，以科技创新驱动材料循环，为制造业提供卓越的可持续材料解决方案"
              speed={60}
              startDelay={1200}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => scrollTo('products')}
              className="btn-gold-primary inline-flex items-center gap-2 py-3 px-7 rounded-lg text-sm font-medium">
              <Box className="w-4 h-4" />
              探索产品
            </button>
            <button onClick={() => scrollTo('about')}
              className="btn-gold-outline inline-flex items-center gap-2 py-3 px-7 rounded-lg text-sm font-medium">
              <ArrowRight className="w-4 h-4" />
              了解更多
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.0 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gold-400"><Counter target={15} suffix="+" /></div>
              <div className="text-xs text-zinc-500 mt-1">年行业经验</div>
            </div>
            <div className="text-center border-x border-gold-400/10">
              <div className="text-2xl md:text-3xl font-bold text-gold-400"><Counter target={50000} suffix="+" /></div>
              <div className="text-xs text-zinc-500 mt-1">吨年产能</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gold-400"><Counter target={300} suffix="+" /></div>
              <div className="text-xs text-zinc-500 mt-1">服务客户</div>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] text-zinc-600 tracking-widest uppercase">Scroll</span>
            <ChevronDown className="w-4 h-4 text-gold-400/40" />
          </div>
        </div>
      </section>

      <section id="products" className="relative py-24 md:py-32">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/20 to-transparent" />
        <div className="max-w-7xl mx-auto px-6">
          <RevealSection className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-gold-400/30 bg-gold-400/[0.08] text-gold-400 mb-4">
              <Layers className="w-3 h-3" />
              PRODUCT CENTER
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mt-4">
              产品<span className="text-gold-400">中心</span>
            </h2>
            <p className="mt-4 text-zinc-400 max-w-xl mx-auto">全系列再生塑料颗粒产品，满足不同应用场景需求</p>
          </RevealSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((product, i) => (
              <RevealSection key={i}>
                <div className="product-card rounded-xl p-6 bg-[rgba(24,24,27,0.6)]" style={{ backdropFilter: 'blur(12px)' }}>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-lg ${product.colorClass} flex items-center justify-center shadow-lg ${product.name === '注塑透明（黑料）颗粒' ? 'border border-zinc-700' : ''}`}
                      style={product.shadow ? { boxShadow: product.shadow } : undefined}>
                      <svg viewBox="0 0 24 24" fill="none" className={`w-6 h-6 ${product.name === '奶白颗粒' ? 'text-amber-800/60' : product.name === '蓝桶颗粒' ? 'text-blue-200' : product.name === '花乙颗粒' ? 'text-gold-900' : product.name === '注塑透明（黑料）颗粒' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        <circle cx="6" cy="6" r="3" fill="currentColor" opacity="0.9" />
                        <circle cx="12" cy="8" r="3.5" fill="currentColor" opacity="0.8" />
                        <circle cx="18" cy="5" r="2.5" fill="currentColor" opacity="0.7" />
                        <circle cx="5" cy="13" r="2.5" fill="currentColor" opacity="0.75" />
                        <circle cx="11" cy="16" r="3" fill="currentColor" opacity="0.85" />
                        <circle cx="17" cy="14" r="2" fill="currentColor" opacity="0.65" />
                        <circle cx="8" cy="20" r="2.5" fill="currentColor" opacity="0.7" />
                        <circle cx="15" cy="20" r="2" fill="currentColor" opacity="0.6" />
                      </svg>
                    </div>
                    <span className={`text-[10px] py-1 px-2.5 rounded-full border ${product.tagClass}`}>{product.tag}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                  <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{product.desc}</p>
                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <CheckCircle className="w-3.5 h-3.5 text-gold-400" />
                      {product.feature}
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/20 to-transparent" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-gold-400/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealSection className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.15),0_0_60px_rgba(212,175,55,0.05)]">
                <img 
                  src="/factory.png" 
                  alt="衡阳鑫德荣新材料科技有限公司" 
                  className="w-full h-[400px] md:h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 flex items-center gap-3">
                  <div className="px-4 py-2 rounded-lg text-xs font-medium text-gold-400 border border-gold-400/20 bg-[rgba(9,9,11,0.8)]" style={{ backdropFilter: 'blur(12px)' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
                      ISO 9001 认证企业
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-3 -right-3 w-16 h-16 border-r-2 border-t-2 border-gold-400/30 rounded-tr-2xl pointer-events-none" />
              <div className="absolute -bottom-3 -left-3 w-16 h-16 border-l-2 border-b-2 border-gold-400/30 rounded-bl-2xl pointer-events-none" />
            </RevealSection>

            <RevealSection>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-gold-400/30 bg-gold-400/[0.08] text-gold-400 mb-4">
                <Building2 className="w-3 h-3" />
                ABOUT US
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mt-4">
                关于<span className="text-gold-400">鑫德荣</span>
              </h2>
              <p className="mt-6 text-zinc-400 leading-relaxed">
                衡阳鑫德荣新材料科技有限公司，坐落于湖南省衡阳市，是一家专注于再生塑料颗粒研发、生产与销售的高新技术企业。公司秉承"科技引领、品质为先"的理念，致力于为全球制造业提供可持续的高品质再生材料解决方案。
              </p>
              <p className="mt-4 text-zinc-400 leading-relaxed">
                凭借先进的生产设备、严格的品质管控体系和丰富的行业经验，我们的产品广泛应用于注塑、吹膜、管材、板材等领域，深受客户信赖。
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3">
                {features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
                    <div className="w-8 h-8 rounded-md bg-gold-400/10 flex items-center justify-center shrink-0">
                      <feat.icon className="w-4 h-4 text-gold-400" />
                    </div>
                    <span className="text-sm text-zinc-300">{feat.text}</span>
                  </div>
                ))}
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      <section id="advantages" className="relative py-24 md:py-32">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/20 to-transparent" />
        <div className="max-w-7xl mx-auto px-6">
          <RevealSection className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-gold-400/30 bg-gold-400/[0.08] text-gold-400 mb-4">
              <Sparkles className="w-3 h-3" />
              CORE ADVANTAGES
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mt-4">
              核心<span className="text-gold-400">优势</span>
            </h2>
            <p className="mt-4 text-zinc-400 max-w-xl mx-auto">以技术创新为核心驱动力，构建全链路竞争壁垒</p>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6">
            {advantages.map((adv, i) => (
              <RevealSection key={i}>
                <div className="product-card rounded-xl p-8 text-center bg-[rgba(24,24,27,0.6)]" style={{ backdropFilter: 'blur(12px)' }}>
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-gold-400/20 to-gold-600/5 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(212,175,55,0.15),0_0_60px_rgba(212,175,55,0.05)]">
                    <adv.icon className="w-7 h-7 text-gold-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{adv.title}</h3>
                  <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{adv.desc}</p>
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-500">{adv.label}</span>
                      <span className="text-gold-400">{adv.value}</span>
                    </div>
                    <ProgressBar percent={adv.percent} />
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection className="mt-12">
            <div className="product-card rounded-xl p-6 md:p-8 bg-[rgba(24,24,27,0.6)]" style={{ backdropFilter: 'blur(12px)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-md bg-gold-400/10 flex items-center justify-center">
                  <Terminal className="w-4 h-4 text-gold-400" />
                </div>
                <span className="text-sm font-medium text-gold-400 tracking-wide">TECHNICAL SPECIFICATIONS</span>
                <div className="flex-1 h-px bg-gradient-to-r from-gold-400/20 to-transparent" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {techSpecs.map((spec, i) => (
                  <div key={i} className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                    <div className="text-2xl font-bold text-gold-400">{spec.value}</div>
                    <div className="text-xs text-zinc-500 mt-1">{spec.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      <section id="contact" className="relative py-24 md:py-32">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/20 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold-400/[0.03] rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6">
          <RevealSection className="text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-gold-400/30 bg-gold-400/[0.08] text-gold-400 mb-4">
              <Phone className="w-3 h-3" />
              CONTACT US
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mt-4">
              联系<span className="text-gold-400">我们</span>
            </h2>
            <p className="mt-6 text-zinc-400 leading-relaxed max-w-2xl mx-auto">
              如需了解更多产品信息或获取报价，欢迎随时与我们取得联系。我们的专业团队将在24小时内为您提供详尽的解决方案。
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              {contactInfo.map((info, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-zinc-800 bg-zinc-900/30">
                  <div className="w-10 h-10 rounded-lg bg-gold-400/10 flex items-center justify-center shrink-0">
                    <info.icon className="w-5 h-5 text-gold-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-zinc-500">{info.label}</div>
                    <div className="text-sm text-zinc-300">{info.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      <footer className="relative border-t border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                  <Hexagon className="w-5 h-5 text-[#09090B]" strokeWidth={2.5} />
                </div>
                <div>
                  <span className="text-base font-semibold text-white">鑫德荣</span>
                  <span className="text-[10px] text-gold-400 block -mt-0.5">XINDERONG</span>
                </div>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">专注高品质再生塑料颗粒<br />以科技创新驱动材料循环</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-white mb-4">产品中心</h4>
              <ul className="space-y-2">
                {['特级透明颗粒', '一级透明颗粒', '二级透明颗粒', '注塑透明颗粒'].map((name, i) => (
                  <li key={i}><button onClick={() => scrollTo('products')} className="text-xs text-zinc-500 hover:text-gold-400 transition-colors">{name}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-white mb-4">更多产品</h4>
              <ul className="space-y-2">
                {['透明颗粒', '奶白颗粒', '花乙颗粒', '蓝桶颗粒'].map((name, i) => (
                  <li key={i}><button onClick={() => scrollTo('products')} className="text-xs text-zinc-500 hover:text-gold-400 transition-colors">{name}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-white mb-4">联系我们</h4>
              <ul className="space-y-2">
                <li className="text-xs text-zinc-500">湖南省衡阳市蒸湘区呆鹰岭镇同康七组</li>
                <li className="text-xs text-zinc-500">17700293551（段）</li>
                <li className="text-xs text-zinc-500">周一至周六 8:00-18:00</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-600">© 2025 衡阳鑫德荣新材料科技有限公司 版权所有</p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-600">湘ICP备XXXXXXXX号</span>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rotate-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes pulse-gold {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes gold-glow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(212,175,55,0.4)) drop-shadow(0 0 20px rgba(212,175,55,0.2)); }
          50% { filter: drop-shadow(0 0 12px rgba(212,175,55,0.6)) drop-shadow(0 0 30px rgba(212,175,55,0.3)); }
        }
        
        /* 导航链接悬停效果 */
        .nav-link:hover {
          color: #D4AF37;
          text-shadow: 0 0 10px rgba(212,175,55,0.5), 0 0 20px rgba(212,175,55,0.3);
        }
        
        /* 导航链接下划线动画 - 使用Tailwind类名实现 */
        
        /* 金色渐变文字 */
        .text-gold-gradient {
          background: linear-gradient(135deg, #E8D48B, #D4AF37, #B8962E);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 10px rgba(212,175,55,0.4)) drop-shadow(0 0 30px rgba(212,175,55,0.2));
        }
        
        /* 金色文字发光效果 */
        .text-gold-glow {
          animation: gold-glow 3s ease-in-out infinite;
        }
        
        /* 主按钮样式 - 金色渐变背景 */
        .btn-gold-primary {
          background: linear-gradient(135deg, #D4AF37, #B8962E);
          color: #09090B;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(212,175,55,0.3);
        }
        .btn-gold-primary:hover {
          background: linear-gradient(135deg, #E8D48B, #D4AF37);
          box-shadow: 0 6px 25px rgba(212,175,55,0.5), 0 0 40px rgba(212,175,55,0.3);
          transform: translateY(-2px);
        }
        .btn-gold-primary:active {
          transform: translateY(0);
          box-shadow: 0 2px 10px rgba(212,175,55,0.4);
        }
        
        /* 轮廓按钮样式 - 金色边框 */
        .btn-gold-outline {
          background: transparent;
          color: #D4AF37;
          border: 1px solid rgba(212,175,55,0.4);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-gold-outline:hover {
          background: rgba(212,175,55,0.1);
          border-color: #D4AF37;
          box-shadow: 0 0 20px rgba(212,175,55,0.2), inset 0 0 20px rgba(212,175,55,0.05);
          text-shadow: 0 0 10px rgba(212,175,55,0.5);
        }
        .btn-gold-outline:active {
          background: rgba(212,175,55,0.15);
        }
        
        /* 进入后台按钮样式 */
        .btn-enter-backend {
          background: linear-gradient(135deg, #D4AF37, #B8962E);
          color: #09090B;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(212,175,55,0.3);
        }
        .btn-enter-backend:hover {
          background: linear-gradient(135deg, #E8D48B, #D4AF37);
          box-shadow: 0 6px 25px rgba(212,175,55,0.5), 0 0 40px rgba(212,175,55,0.3);
          transform: translateY(-2px);
        }
        .btn-enter-backend:active {
          transform: translateY(0);
          box-shadow: 0 2px 10px rgba(212,175,55,0.4);
        }
        
        .product-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(212,175,55,0.1);
          position: relative;
          overflow: hidden;
        }
        .product-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #D4AF37, transparent);
          opacity: 0;
          transition: opacity 0.4s;
        }
        .product-card:hover::before { opacity: 1; }
        .product-card:hover {
          border-color: rgba(212,175,55,0.3);
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 30px rgba(212,175,55,0.08);
        }
        .color-clear { background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(220,220,220,0.5)); }
        .color-black { background: linear-gradient(135deg, #1a1a1a, #333); }
        .color-milky { background: linear-gradient(135deg, #F5F0E8, #E8DDD0); }
        .color-multi { background: linear-gradient(135deg, #D4AF37, #8B7225, #D4AF37); }
        .color-blue { background: linear-gradient(135deg, #2563EB, #1D4ED8); }
      `}</style>
    </div>
  );
}
