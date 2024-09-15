"use client";

import { Card, CardBody } from "@nextui-org/react";
import { useAccount } from "wagmi";

import { AppShell } from "@/components/app-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { address } = useAccount();

  if (!address) {
    return (
      <AppShell>
        <div className="space-y-5">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-foreground text-2xl font-bold leading-7 sm:truncate sm:text-3xl sm:tracking-tight">
                Wallet Disconnected
              </h2>
            </div>
          </div>
          <Card className="bg-danger-300">
            <CardBody>Please connect your wallet before continuing</CardBody>
          </Card>
        </div>
      </AppShell>
    );
  }

  return <AppShell>{children}</AppShell>;
}
