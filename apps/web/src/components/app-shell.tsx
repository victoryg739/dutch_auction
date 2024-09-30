"use client";

import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  useDisclosure,
} from "@nextui-org/react";

import React, { useState } from "react";

import { ConnectWallet } from "./ConnectWallet";
import { CustomLogo } from "./CustomLogo";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

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
