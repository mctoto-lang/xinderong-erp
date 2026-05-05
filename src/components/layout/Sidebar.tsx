'use client';

import {
  IconDashboard,
  IconShoppingCart,
  IconTruckDelivery,
  IconTool,
  IconBuildingWarehouse,
  IconCoin,
  IconUsers,
  IconBuilding,
  IconTruck,
  IconChartBar,
  IconSettings,
  IconRecycle,
  IconUserCircle,
  IconLogout,
  IconChevronRight,
  IconChevronDown,
} from '@tabler/icons-react';

import { useAppStore } from '@/lib/store';
import { COMPANY_NAME, COMPANY_SUBTITLE } from '@/lib/constants';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { ModuleKey } from '@/lib/types';

// ─── Icon Map ────────────────────────────────────────────────

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingCart: IconShoppingCart,
  Truck: IconTruckDelivery,
  Factory: IconTool,
  Warehouse: IconBuildingWarehouse,
  DollarSign: IconCoin,
  Users: IconUsers,
  Building2: IconBuilding,
  Package: IconTruck,
  BarChart3: IconChartBar,
  Settings: IconSettings,
};

// ─── Nav Groups ───────────────────────────────────────────────

const navGroups = [
  {
    label: '核心业务',
    icon: IconShoppingCart,
    defaultOpen: true,
    items: [
      { key: 'purchase' as ModuleKey, label: '进货管理', icon: 'ShoppingCart' },
      { key: 'sales' as ModuleKey, label: '出货管理', icon: 'Truck' },
      { key: 'production' as ModuleKey, label: '生产加工', icon: 'Factory' },
      { key: 'inventory' as ModuleKey, label: '库存管理', icon: 'Warehouse' },
    ],
  },
  {
    label: '关系与资产管理',
    icon: IconUsers,
    defaultOpen: true,
    items: [
      { key: 'customer' as ModuleKey, label: '客户管理', icon: 'Users' },
      { key: 'supplier' as ModuleKey, label: '供应商管理', icon: 'Building2' },
      { key: 'finance' as ModuleKey, label: '财务管理', icon: 'DollarSign' },
    ],
  },
  {
    label: '数据与支持',
    icon: IconChartBar,
    defaultOpen: true,
    items: [
      { key: 'charts' as ModuleKey, label: '图表分析', icon: 'BarChart3' },
      { key: 'logistics' as ModuleKey, label: '物流运输', icon: 'Package' },
    ],
    adminOnlyItems: [
      { key: 'system' as ModuleKey, label: '系统管理', icon: 'Settings' },
    ],
  },
];

// ─── Collapsible Group ────────────────────────────────────────

function NavGroup({
  group,
  activeModule,
  onNavigate,
  currentUserRole,
}: {
  group: (typeof navGroups)[number];
  activeModule: ModuleKey;
  onNavigate: (key: ModuleKey) => void;
  currentUserRole?: string;
}) {
  const GroupIcon = group.icon;
  const [open, setOpen] = React.useState(group.defaultOpen);
  const isAdmin = currentUserRole === 'admin';
  const allItems = isAdmin && group.adminOnlyItems
    ? [...group.items, ...group.adminOnlyItems]
    : group.items;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={group.label}>
            <GroupIcon className="size-4" />
            <span>{group.label}</span>
            <IconChevronDown className={`ml-auto size-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-0' : 'rotate-90'}`} />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <SidebarMenuSub>
            {allItems.map((item) => {
              const Icon = iconMap[item.icon] || IconDashboard;
              return (
                <SidebarMenuSubItem key={item.key}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={activeModule === item.key}
                    onClick={() => onNavigate(item.key)}
                  >
                    <button className="w-full text-left">
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </button>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

import * as React from 'react';

// ─── Sidebar Component ───────────────────────────────────────

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { activeModule, setActiveModule, currentUser, logout } = useAppStore();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <IconRecycle className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{COMPANY_NAME}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {COMPANY_SUBTITLE}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* 首页仪表盘 - 单独置顶 */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeModule === 'dashboard'}
                  onClick={() => setActiveModule('dashboard')}
                  tooltip="首页仪表盘"
                >
                  <IconDashboard className="size-4" />
                  <span>首页仪表盘</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* 可折叠分组 - 主/副层级 */}
              {navGroups.map((group) => (
                <NavGroup
                  key={group.label}
                  group={group}
                  activeModule={activeModule}
                  onNavigate={setActiveModule}
                  currentUserRole={currentUser?.role}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-muted text-xs font-medium">
                      {currentUser?.name?.slice(0, 1) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {currentUser?.name || '用户'}
                    </span>
                  </div>
                  <IconChevronRight className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-muted">
                        {currentUser?.name?.slice(0, 1) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{currentUser?.name || '用户'}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {currentUser?.role === 'admin' && (
                  <DropdownMenuGroup>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => setActiveModule('system')}>
                      <IconUserCircle className="mr-2 size-4" />
                      个人设置
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600"
                  onClick={logout}
                >
                  <IconLogout className="mr-2 size-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
