"use client";

import { Card, CardBody } from "@nextui-org/react";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/app-shell";

export default function UserDashboard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { address: userAddress } = useAccount();

  if (userAddress) {
    return <AppShell>{children}</AppShell>;
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-foreground text-center text-2xl font-bold leading-7 sm:truncate sm:text-3xl sm:tracking-tight">
              Wallet Not Connected
            </h2>
          </div>
        </div>
        <Card className="bg-red-700">
          <CardBody>Please connect your wallet to continue.</CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
