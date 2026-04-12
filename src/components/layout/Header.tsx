'use client';

import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import { MODULES } from '@/lib/constants';

export function Header() {
  const { activeModule } = useAppStore();
  const currentModule = MODULES.find(m => m.key === activeModule);
  const [showNotification, setShowNotification] = useState(false);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">
          {currentModule?.label || '首页仪表盘'}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setShowNotification(!showNotification)}
            >
              <Bell className="size-4" />
            </Button>

            {showNotification && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotification(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-lg border border-gray-200 bg-background shadow-lg">
                  <div className="flex items-center justify-between p-3 border-b border-gray-100">
                    <span className="text-sm font-medium">通知提醒</span>
                    <Button variant="ghost" size="icon" className="size-6" onClick={() => setShowNotification(false)}>
                      <X className="size-3.5" />
                    </Button>
                  </div>
                  <div className="p-3">
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      暂无通知
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
