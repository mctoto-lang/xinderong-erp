'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, Shield, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { initDatabase, dbUsers, dbAuditLogs } from '@/lib/api';
import { COMPANY_NAME, COMPANY_SUBTITLE } from '@/lib/constants';

export default function LoginPage() {
  const { login, setDbInitialized, setShowWelcome } = useAppStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    initDatabase()
      .then(() => {
        setDbInitialized(true);
        setDbLoading(false);
      })
      .catch(() => {
        setError('数据库初始化失败，请刷新页面重试。');
        setDbLoading(false);
      });
  }, [setDbInitialized]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await dbUsers.getByUsername(username);
      if (!user) {
        setError('用户名不存在');
        setLoading(false);
        return;
      }
      if (user.password !== password) {
        setError('密码错误');
        setLoading(false);
        return;
      }
      if (user.status === 'disabled') {
        setError('该账户已被禁用');
        setLoading(false);
        return;
      }

      user.lastLoginAt = new Date().toISOString();
      await dbUsers.put(user);

      await dbAuditLogs.add({
        operator: user.name,
        module: '系统',
        action: '登录',
        detail: `${user.name} 登录系统`,
      });

      login(user);
    } catch {
      setError('登录失败，请重试');
    }
    setLoading(false);
  };

  const handleBack = () => {
    setShowWelcome(true);
  };

  if (dbLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative">
            <div className="w-16 h-16 border-2 border-white/20 rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-white/60 text-sm tracking-widest uppercase">系统初始化中</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <span className="text-white font-semibold tracking-wide">XINDERONG</span>
          </motion.div>

          {/* Main content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-white leading-tight">
                {COMPANY_NAME}
              </h1>
              <p className="text-xl text-white/50 font-light">
                {COMPANY_SUBTITLE}
              </p>
            </div>
            
            <div className="w-24 h-px bg-gradient-to-r from-white/50 to-transparent" />
            
            <p className="text-white/40 leading-relaxed max-w-md">
              以创新科技为驱动，以卓越品质为基石，致力于成为新材料领域的行业领军者。
              我们以数字化赋能传统产业，构建智慧工厂新生态。
            </p>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex items-center gap-6 text-white/30 text-sm"
          >
            <span>© {new Date().getFullYear()}</span>
            <span>·</span>
            <span>版权所有</span>
          </motion.div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleBack}
          className="absolute top-8 left-8 flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">返回首页</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-black" />
            </div>
          </div>

          {/* Form header */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">欢迎回来</h2>
            <p className="text-white/40">请登录您的账户以继续</p>
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white/70 text-center"
              >
                {error}
              </motion.div>
            )}

            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm text-white/60 font-medium">
                用户名
              </label>
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:ring-white/20"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm text-white/60 font-medium">
                密码
              </label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:ring-white/20"
              />
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-white text-black hover:bg-white/90 font-medium rounded-lg transition-all duration-300"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                '登 录'
              )}
            </Button>
          </form>

          {/* Security notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 flex items-center justify-center gap-2 text-white/30 text-xs"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>安全登录 · 数据加密传输</span>
          </motion.div>

          {/* Mobile footer */}
          <div className="lg:hidden mt-12 text-center text-white/20 text-xs">
            © {new Date().getFullYear()} {COMPANY_NAME}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
