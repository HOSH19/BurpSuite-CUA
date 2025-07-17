/**
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarTrigger,
} from '@renderer/components/ui/sidebar';

import logoVector from '@resources/logo-vector.png?url';
import burpsuiteLogo from '@resources/burpsuite-logo.png?url';

interface HeaderProps {
  showTrigger: boolean;
}

export function UITarsHeader({ showTrigger }: HeaderProps) {
  return (
    <SidebarMenu className="items-center">
      <SidebarMenuButton
        // size="lg"
        className="group-data-[collapsible=icon]:p-0! mb-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-transparent"
      >
        <div className="flex items-center gap-2">
          <div className="flex aspect-square size-6 items-center justify-center rounded-lg">
            <img src={logoVector} alt="UI-TARS" />
          </div>
          <span className="text-xs font-medium">×</span>
          <div className="flex aspect-square size-6 items-center justify-center rounded-lg">
            <img src={burpsuiteLogo} alt="Burpsuite" />
          </div>
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">UI-TARS × Burpsuite</span>
        </div>
      </SidebarMenuButton>
      {showTrigger && (
        <SidebarTrigger className="absolute top-12 right-2 group-data-[collapsible=icon]:right-[-36px]" />
      )}
    </SidebarMenu>
  );
}
