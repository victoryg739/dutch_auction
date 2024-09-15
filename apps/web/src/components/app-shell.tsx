"use client";

import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  useDisclosure,
} from "@nextui-org/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

import { ConnectWallet } from "./ConnectWallet";
import { CustomLogo } from "./CustomLogo";

import { getBasePath } from "@/lib/utils/base-path";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const path = usePathname();
  const basePath = getBasePath(path);

  const menuItems = [
    "Profile",
    "Dashboard",
    "Activity",
    "Analytics",
    "System",
    "Deployments",
    "My Settings",
    "Team Settings",
    "Help & Feedback",
    "Log Out",
  ];

  return (
    <>
      <Navbar onMenuOpenChange={setIsMenuOpen} isBordered>
        <NavbarContent>
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="sm:hidden"
          />
          <NavbarBrand>
            <CustomLogo className="h-[24px] w-[120px]" />
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent justify="end">
          <NavbarItem>
            <ConnectWallet
              isOpen={isOpen}
              onOpen={onOpen}
              onOpenChange={onOpenChange}
            />
          </NavbarItem>
        </NavbarContent>
      </Navbar>
      <main className="mx-auto max-w-[1024px] px-6 py-10">{children}</main>
    </>
  );
}
