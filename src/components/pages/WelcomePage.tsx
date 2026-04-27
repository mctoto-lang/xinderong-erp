'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  FlaskConical,
  Globe,
  Headphones,
  Leaf,
  MapPin,
  Menu,
  Monitor,
  Package,
  Phone,
  Recycle,
  ScanLine,
  Search,
  ShieldCheck,
  Truck,
  X,
} from 'lucide-react';

interface WelcomePageProps {
  onEnterBackend: () => void;
}

const products = [
  {
    name: '特级透明颗粒',
    desc: '最高品质透明再生颗粒，纯净度极高',
    tag: 'PREMIUM',
    image: '/product-transparent.png',
    dotColor: 'bg-amber-400',
  },
  {
    name: '一级透明颗粒',
    desc: '优质透明颗粒，性价比优异',
    tag: 'GRADE A',
    image: '/product-white.png',
    dotColor: 'bg-green-400',
  },
  {
    name: '二级透明颗粒',
    desc: '经济型透明颗粒，满足一般品质需求',
    tag: 'GRADE B',
    image: '/product-white.png',
    dotColor: 'bg-green-400',
  },
  {
    name: '注塑透明（黑料）颗粒',
    desc: '专用注塑级颗粒，流动性能优异',
    tag: 'INJECTION',
    image: '/product-black.png',
    dotColor: 'bg-gray-400',
  },
  {
    name: '透明颗粒',
    desc: '通用型透明颗粒，品质可靠',
    tag: 'STANDARD',
    image: '/product-white.png',
    dotColor: 'bg-green-400',
  },
  {
    name: '奶白颗粒',
    desc: '色泽均匀的乳白色颗粒，遮盖力强',
    tag: 'MILKY',
    image: '/product-gray.png',
    dotColor: 'bg-white border border-gray-300',
  },
  {
    name: '花乙颗粒',
    desc: '聚乙烯混合料颗粒，综合性能优异',
    tag: 'MIXED PE',
    image: '/product-gray.png',
    dotColor: 'bg-white border border-gray-300',
  },
  {
    name: '蓝桶颗粒',
    desc: '蓝色桶料专用再生颗粒，色彩饱满稳定',
    tag: 'BLUE DRUM',
    image: '/product-blue.png',
    dotColor: 'bg-blue-400',
  },
];

const features = [
  { icon: ShieldCheck, title: '高品质保障', desc: '严格的质量管控体系' },
  { icon: Leaf, title: '环保可持续', desc: '绿色生产与可回收材料' },
  { icon: Package, title: '定制化服务', desc: '高度多样化的应用需求' },
  { icon: Globe, title: '全球供应', desc: '确定完全供应链体系' },
];

const navLinks = [
  { label: '首页', id: 'home' },
  { label: '产品中心', id: 'products' },
  { label: '核心优势', id: 'advantages' },
  { label: '关于我们', id: 'about' },
  { label: '联系我们', id: 'contact' },
] as const;

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
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
      className={`transition-all duration-700 ease-out ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'} ${className}`}
    >
      {children}
    </div>
  );
}

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  const { ref, visible } = useReveal();
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        ref={ref}
        className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`}
        style={{ width: visible ? `${progress}%` : '0%' }}
      />
    </div>
  );
}

export default function WelcomePage({ onEnterBackend }: WelcomePageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

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
    <div className="min-h-screen overflow-x-hidden bg-white text-[#141414]">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#1a1a1a]/95 px-6 py-4 backdrop-blur-xl md:px-12">
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
                  className={`relative text-sm transition-colors ${active ? 'font-medium text-white' : 'text-white/60 hover:text-white'}`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute -bottom-5 left-0 h-0.5 w-full bg-white" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onEnterBackend}
              className="hidden rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 md:block"
            >
              进入后台
            </button>

            <button
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white lg:hidden"
              onClick={() => setMobileMenuOpen(v => !v)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="mx-auto mt-4 max-w-[1400px] rounded-2xl border border-white/10 bg-[#1f1f1f]/95 p-4 backdrop-blur-xl lg:hidden">
            <div className="space-y-1">
              {navLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className={`block w-full rounded-xl px-4 py-3 text-left text-sm transition-colors ${activeSection === link.id ? 'bg-white/10 font-medium text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={onEnterBackend}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black"
              >
                <Monitor className="h-4 w-4" />
                进入后台
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="relative z-10">
        <section id="home" className="relative min-h-screen overflow-hidden bg-[#0d0d0d] pt-20">
          <div className="absolute inset-0">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "url('/welcome-hero-bg.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d] via-[#0d0d0d]/70 to-[#0d0d0d]/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-[#0d0d0d]/60" />
          </div>

          <div className="relative mx-auto flex max-w-[1400px] min-h-[calc(100vh-80px)] items-center px-6 md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-xl"
            >
              <div className="mb-6 inline-flex items-center gap-3">
                <span className="h-px w-8 bg-white/30" />
                <span className="text-xs tracking-[0.25em] text-white/50">QUALITY MATERIALS, INFINITE POSSIBILITIES</span>
                <span className="h-px w-16 bg-white/30" />
              </div>

              <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
                衡阳鑫德荣新材料
                <br />
                科技有限公司
              </h1>

              <p className="mb-6 text-lg text-white/60 md:text-xl">
                专业塑料颗粒解决方案提供商
              </p>

              <p className="mb-10 max-w-lg text-sm leading-relaxed text-white/40">
                我们致力于研发、生产高品质高性能塑料颗粒，
                为全球客户提供创新、环保、可信赖的材料解决方案。
              </p>

              <button
                onClick={() => scrollTo('products')}
                className="group inline-flex items-center gap-3 rounded-none border border-white/20 bg-transparent px-8 py-3.5 text-sm font-medium text-white transition-all hover:border-white/50 hover:bg-white/5"
              >
                了解更多
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          </div>
        </section>

        <section id="products" className="bg-white py-24 md:py-32">
          <div className="mx-auto max-w-[1400px] px-6 md:px-12">
            <RevealSection className="mb-16 text-center">
              <div className="mb-4 flex w-full items-center justify-center gap-3">
                <span className="h-px w-12 bg-gray-300" />
                <span className="text-xs tracking-[0.25em] text-gray-400">PRODUCT CENTER</span>
                <span className="h-px w-12 bg-gray-300" />
              </div>
              <h2 className="mb-4 flex w-full items-center justify-center gap-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                <Package className="h-8 w-8 text-gray-700" />
                产品中心
              </h2>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-gray-500">
                多种高性能塑料颗粒，满足不同行业的应用需求
              </p>
            </RevealSection>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product, index) => (
                <RevealSection key={product.name}>
                  <div className="group cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white transition-all hover:-translate-y-1 hover:shadow-lg">
                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="p-5">
                      <span className="mb-3 inline-flex items-center gap-2 rounded-md bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white">
                        <span className={`h-2 w-2 animate-pulse rounded-full ${product.dotColor}`} />
                        {product.tag}
                      </span>
                      <h3 className="mb-2 text-base font-semibold text-gray-900">{product.name}</h3>
                      <p className="mb-4 text-sm leading-relaxed text-gray-500">{product.desc}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 transition-colors group-hover:text-black">
                        了解更多
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        <section id="advantages" className="bg-gray-50 py-24 md:py-32">
          <div className="mx-auto max-w-[1200px] px-6 md:px-12">
            <RevealSection className="mb-16 text-center">
              <div className="mb-4 flex w-full items-center justify-center gap-3">
                <span className="h-px w-12 bg-gray-300" />
                <span className="text-xs tracking-[0.25em] text-gray-400">CORE ADVANTAGES</span>
                <span className="h-px w-12 bg-gray-300" />
              </div>
              <h2 className="mb-4 flex w-full items-center justify-center gap-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                <ShieldCheck className="h-8 w-8 text-gray-700" />
                核心优势
              </h2>
            </RevealSection>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: FlaskConical, title: '先进工艺', desc: '引进国际领先的清洗、分选、造粒生产线，确保每一粒产品都达到严苛品质标准', value: '98%', label: '纯度指标', progress: 98, color: 'bg-blue-500' },
                { icon: ScanLine, title: '严苛质检', desc: '全流程品质监控，从原料进厂到成品出厂，多道检测工序保障品质稳定', value: '99.5%', label: '合格率', progress: 99.5, color: 'bg-green-500' },
                { icon: Leaf, title: '绿色环保', desc: '践行可持续发展理念，循环再生降低碳排放，助力国家双碳目标实现', value: '85%', label: '碳减排', progress: 85, color: 'bg-emerald-500' },
              ].map(item => (
                <RevealSection key={item.title}>
                  <div className="rounded-2xl border border-gray-100 bg-white p-8 transition-shadow hover:shadow-lg">
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50">
                      <item.icon className="h-6 w-6 text-gray-700" />
                    </div>
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="mb-5 text-sm leading-relaxed text-gray-500">{item.desc}</p>
                    <div className="mb-3 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">{item.value}</span>
                      <span className="text-sm text-gray-400">{item.label}</span>
                    </div>
                    <ProgressBar progress={item.progress} color={item.color} />
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="bg-white py-24 md:py-32">
          <div className="mx-auto max-w-[1200px] px-6 md:px-12">
            <div className="grid items-center gap-16 lg:grid-cols-2">
              <RevealSection>
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-px w-12 bg-gray-300" />
                  <span className="text-xs tracking-[0.25em] text-gray-400">ABOUT US</span>
                  <span className="h-px w-12 bg-gray-300" />
                </div>
                <h2 className="mb-6 flex items-center gap-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                  <Building2 className="h-8 w-8 text-gray-700" />
                  关于我们
                </h2>
                <p className="mb-6 text-base leading-relaxed text-gray-600">
                  衡阳鑫德荣新材料科技有限公司是一家专注于再生塑料颗粒研发与生产的高新技术企业。
                  公司拥有先进的生产设备和完善的质检体系，致力于为客户提供高品质、环保型的塑料材料解决方案。
                </p>
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { value: '15+', label: '年行业经验' },
                    { value: '50000+', label: '吨年产能' },
                    { value: '300+', label: '服务客户' },
                  ].map(stat => (
                    <div key={stat.label}>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="mt-1 text-xs text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </RevealSection>

              <RevealSection>
                <div className="aspect-video overflow-hidden rounded-2xl bg-gray-100">
                  <img
                    src="/factory.png"
                    alt="厂区图片"
                    className="h-full w-full object-cover"
                  />
                </div>
              </RevealSection>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(item => (
                <RevealSection key={item.title}>
                  <div className="group flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white transition-colors group-hover:border-gray-300 group-hover:bg-gray-50">
                      <item.icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="mb-1 text-base font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm leading-relaxed text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="bg-white py-24 md:py-32">
          <div className="mx-auto max-w-[1200px] px-6 md:px-12">
            <RevealSection className="mb-16 text-center">
              <div className="mb-4 flex w-full items-center justify-center gap-3">
                <span className="h-px w-12 bg-gray-300" />
                <span className="text-xs tracking-[0.25em] text-gray-400">CONTACT US</span>
                <span className="h-px w-12 bg-gray-300" />
              </div>
              <h2 className="flex w-full items-center justify-center gap-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                <Phone className="h-8 w-8 text-gray-700" />
                联系我们
              </h2>
            </RevealSection>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: MapPin, label: '公司地址', value: '湖南省衡阳市蒸湘区呆鹰岭镇同康七组' },
                { icon: Phone, label: '联系电话', value: '17700293551（段）' },
                { icon: Clock, label: '营业时间', value: '周一至周六 8:00 - 18:00' },
              ].map(item => (
                <RevealSection key={item.label}>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                      <item.icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <h3 className="mb-1 text-sm font-semibold text-gray-900">{item.label}</h3>
                    <p className="text-sm text-gray-500">{item.value}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-white/5 bg-[#0d0d0d] py-12">
          <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 px-6 md:flex-row md:px-12">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-8 w-auto rounded object-contain" />
              <span className="text-sm font-medium text-white/60">衡阳鑫德荣新材料科技有限公司</span>
            </div>
            <p className="text-xs text-white/30">© 2026 衡阳鑫德荣新材料科技有限公司 版权所有</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
