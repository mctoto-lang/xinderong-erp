'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
  FieldSeparator,
} from '@/components/ui/field';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { initDatabase, dbUsers, dbAuditLogs } from '@/lib/api';

/** 统一的未开放提示 HoverCard 内容 */
function NotAvailableHint() {
  return (
    <HoverCardContent className="w-52 p-0">
      <div className="flex flex-col gap-0.5 p-3">
        <p className="text-sm font-semibold text-gray-900">XinDeRong2026</p>
        <p className="text-sm text-black">未开放功能，仅供内部使用</p>
        <p className="text-xs text-gray-500">创建于2026年4月</p>
      </div>
    </HoverCardContent>
  );
}

export default function LoginPage() {
  const { login, setDbInitialized } = useAppStore();
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

  if (dbLoading) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-black" />
          <p className="text-sm text-muted-foreground">正在初始化系统...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">
              <form className="p-6 md:p-8" onSubmit={handleLogin}>
                <FieldGroup>
                  {/* Title - centered */}
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">欢迎回来</h1>
                    <p className="text-balance text-muted-foreground">
                      衡阳鑫德荣新材料科技有限公司
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Username */}
                  <Field>
                    <FieldLabel htmlFor="username">用户名</FieldLabel>
                    <Input
                      id="username"
                      type="text"
                      placeholder="请输入用户名"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </Field>

                  {/* Password */}
                  <Field>
                    <div className="flex items-center">
                      <FieldLabel htmlFor="password">密码</FieldLabel>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <a
                            href="#"
                            className="ml-auto text-sm underline-offset-2 hover:underline"
                            onClick={(e) => e.preventDefault()}
                          >
                            忘记密码？
                          </a>
                        </HoverCardTrigger>
                        <NotAvailableHint />
                      </HoverCard>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="请输入密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Field>

                  {/* Submit */}
                  <Field>
                    <Button type="submit" disabled={loading} className="w-full">
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      登录
                    </Button>
                  </Field>

                  {/* Separator */}
                  <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                    或使用以下方式继续
                  </FieldSeparator>

                  {/* Social login - Apple / Google / Meta icons from example */}
                  <Field className="grid grid-cols-3 gap-4">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="outline" type="button">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
                            <path
                              d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                              fill="currentColor"
                            />
                          </svg>
                          <span className="sr-only">使用 Apple 登录</span>
                        </Button>
                      </HoverCardTrigger>
                      <NotAvailableHint />
                    </HoverCard>

                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="outline" type="button">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
                            <path
                              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                              fill="currentColor"
                            />
                          </svg>
                          <span className="sr-only">使用 Google 登录</span>
                        </Button>
                      </HoverCardTrigger>
                      <NotAvailableHint />
                    </HoverCard>

                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="outline" type="button">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
                            <path
                              d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
                              fill="currentColor"
                            />
                          </svg>
                          <span className="sr-only">使用 Meta 登录</span>
                        </Button>
                      </HoverCardTrigger>
                      <NotAvailableHint />
                    </HoverCard>
                  </Field>

                  {/* Register */}
                  <FieldDescription className="text-center">
                    还没有账户？
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <a href="#" className="font-medium underline-offset-2 hover:underline" onClick={(e) => e.preventDefault()}>
                          注册
                        </a>
                      </HoverCardTrigger>
                      <NotAvailableHint />
                    </HoverCard>
                  </FieldDescription>
                </FieldGroup>
              </form>

              {/* Right: Machine image */}
              <div className="relative hidden bg-muted md:block">
                <img
                  src="/login-machine.jpg"
                  alt="塑料颗粒加工设备"
                  className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                />
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          <FieldDescription className="px-6 text-center">
            点击继续即表示你同意我们的{' '}
            <HoverCard>
              <HoverCardTrigger asChild>
                <a href="#" className="underline-offset-2 hover:underline" onClick={(e) => e.preventDefault()}>
                  服务条款
                </a>
              </HoverCardTrigger>
              <NotAvailableHint />
            </HoverCard>
            {' '}和{' '}
            <HoverCard>
              <HoverCardTrigger asChild>
                <a href="#" className="underline-offset-2 hover:underline" onClick={(e) => e.preventDefault()}>
                  隐私政策
                </a>
              </HoverCardTrigger>
              <NotAvailableHint />
            </HoverCard>
            。
          </FieldDescription>
        </div>
      </div>
    </div>
  );
}
