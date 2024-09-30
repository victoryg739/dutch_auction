"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { clsx } from "clsx";
import { toast } from "sonner";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { ArrowPathIcon, ChevronLeftIcon } from "@heroicons/react/20/solid";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Divider,
  Snippet,
  useDisclosure,
} from "@nextui-org/react";
import { LuBitcoin } from "react-icons/lu";

import { BidModal } from "@/components/BidModal";
import {
  useAuctionTokenBalanceOf,
  useAuctionTokenName,
  useAuctionTokenSymbol,
  useDutchAuctionDistributeTokens,
  useDutchAuctionGetAuctionEnded,
  useDutchAuctionGetClearingPrice,
  useDutchAuctionGetCommitmentByBidder,
  useDutchAuctionGetCurrentPrice,
  useDutchAuctionGetDuration,
  useDutchAuctionGetRemainingSupply,
  useDutchAuctionGetReservedPrice,
  useDutchAuctionGetStartPrice,
  useDutchAuctionGetStartTime,
  useDutchAuctionGetToken,
  useDutchAuctionGetTokensDistributed,
  useDutchAuctionGetTotalSupply,
} from "@/generated";
import { useCountdownTimer } from "@/hooks/useCountdownTimer";
import { formatTimeLeft } from "@/lib/utils/countdown";

export default function AuctionPage() {
  // Get auction contract address from URL parameters
  const { contractAddress: auctionAddress } = useParams();

  // Get current user account
  const { address: userAddress } = useAccount();

  // Fetch token metadata
  const { data: auctionTokenAddress } = useDutchAuctionGetToken({
    address: auctionAddress as `0x${string}`,
  });
  const { data: auctionTokenName } = useAuctionTokenName({
    address: auctionTokenAddress,
  });
  const { data: auctionTokenSymbol } = useAuctionTokenSymbol({
    address: auctionTokenAddress,
  });

  // Fetch static auction data
  const { data: auctionTotalSupply } = useDutchAuctionGetTotalSupply({
    address: auctionAddress as `0x${string}`,
  });
  const { data: auctionStartPrice } = useDutchAuctionGetStartPrice({
    address: auctionAddress as `0x${string}`,
  });
  const { data: auctionReservePrice } = useDutchAuctionGetReservedPrice({
    address: auctionAddress as `0x${string}`,
  });
  const { data: auctionStartTime } = useDutchAuctionGetStartTime({
    address: auctionAddress as `0x${string}`,
  });
  const auctionStartDate = useMemo(() => {
    return new Date(Number(auctionStartTime) * 1000);
  }, [auctionStartTime]);
  const { data: auctionDuration } = useDutchAuctionGetDuration({
    address: auctionAddress as `0x${string}`,
  });

  // Fetch dynamic data - Needs refetch
  const { data: userTokenBalance, refetch: refetchUserBalance } =
    useAuctionTokenBalanceOf({
      args: [userAddress!],
      address: auctionTokenAddress,
      enabled: Boolean(userAddress),
    });
  const { data: tokensDistributed, refetch: refetchTokensDistributed } =
    useDutchAuctionGetTokensDistributed({
      address: auctionAddress as `0x${string}`,
    });
  const { data: userCommitment, refetch: refetchUserCommitment } =
    useDutchAuctionGetCommitmentByBidder({
      args: [userAddress!],
      address: auctionAddress as `0x${string}`,
      enabled: Boolean(userAddress),
    });
  const { data: currentAuctionPrice, refetch: refetchCurrentPrice } =
    useDutchAuctionGetCurrentPrice({
      address: auctionAddress as `0x${string}`,
    });
  const { data: auctionHasEnded, refetch: refetchAuctionEnded } =
    useDutchAuctionGetAuctionEnded({
      address: auctionAddress as `0x${string}`,
    });
  const { data: auctionClearingPrice, refetch: refetchClearingPrice } =
    useDutchAuctionGetClearingPrice({
      address: auctionAddress as `0x${string}`,
      enabled: auctionHasEnded,
    });
  const { data: remainingAuctionSupply, refetch: refetchRemainingSupply } =
    useDutchAuctionGetRemainingSupply({
      address: auctionAddress as `0x${string}`,
    });

  // Function to distribute tokens
  const { write: executeDistributeTokens } = useDutchAuctionDistributeTokens({
    address: auctionAddress as `0x${string}`,
    onSuccess() {
      toast.success("Tokens distributed successfully");
    },
  });

  // Countdown timer
  const { minutes: countdownMinutes, seconds: countdownSeconds } =
    useCountdownTimer(auctionStartDate, Number(auctionDuration));

  // Modal controls
  const {
    isOpen: isBidModalOpen,
    onOpen: openBidModal,
    onOpenChange: handleBidModalChange,
  } = useDisclosure();

  // Refetch data function
  const refetchData = () => {
    refetchUserBalance();
    refetchRemainingSupply();
    refetchTokensDistributed();
    refetchUserCommitment();
    refetchCurrentPrice();
    refetchAuctionEnded();
    refetchClearingPrice();
  };

  // Loading state
  if (
    !auctionAddress ||
    auctionHasEnded === undefined ||
    tokensDistributed === undefined
  ) {
    return (
      <Card>
        <CardBody>
          <p className="text-white">Auction not found</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="space-y-5">
        <nav aria-label="Back">
          <Link
            href={`/auctions`}
            className="flex items-center text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            <ChevronLeftIcon
              className="-ml-1 mr-1 h-5 w-5 flex-shrink-0 text-blue-400"
              aria-hidden="true"
            />
            Browse Auctions
          </Link>
        </nav>

        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="mb-2 text-xl font-semibold text-white">
              Token Name: {auctionTokenName}
            </h2>
            <h2 className="mb-5 text-xl font-semibold text-white">
              Token Symbol: {auctionTokenSymbol}
            </h2>
          </div>
          <div className="mt-4 flex flex-shrink-0 gap-2 md:ml-4 md:mt-0">
            <Button
              onClick={refetchData}
              startContent={<ArrowPathIcon className="h-4 w-4" />}
              variant="light"
              className="text-white"
            >
              Refresh
            </Button>
            {auctionHasEnded ? (
              <Button
                onClick={executeDistributeTokens}
                startContent={<LuBitcoin className="h-4 w-4" />}
                isDisabled={!auctionHasEnded || tokensDistributed}
                className="text-white"
              >
                {tokensDistributed ? "Tokens Distributed" : "Distribute Tokens"}
              </Button>
            ) : (
              currentAuctionPrice !== undefined &&
              remainingAuctionSupply !== undefined && (
                <BidModal
                  contractAddress={auctionAddress as `0x${string}`}
                  currentPrice={currentAuctionPrice}
                  auctionEnded={auctionHasEnded}
                  remainingSupply={remainingAuctionSupply}
                  refetch={refetchData}
                  isOpen={isBidModalOpen}
                  onOpen={openBidModal}
                  onOpenChange={handleBidModalChange}
                />
              )
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {auctionHasEnded ? (
            <Chip color="success" variant="flat">
              Auction Ended
            </Chip>
          ) : (
            <>
              <Chip color="warning" variant="flat">
                Auction In Progress
              </Chip>
              <Chip variant="flat">
                {formatTimeLeft({
                  minutes: countdownMinutes,
                  seconds: countdownSeconds,
                })}
              </Chip>
            </>
          )}
        </div>
      </div>
      <Divider />

      {/* Auction Details Section */}
      <AuctionDetailsSection
        items={[
          {
            name: "Start Time",
            element: auctionStartDate.toLocaleString(),
          },
          {
            name: "Duration",
            element: `${Number(auctionDuration) / 60} minutes`,
          },
          {
            name: "Auction Address",
            element: (
              <Snippet hideSymbol color="primary" variant="flat">
                <div className="w-52">
                  <p className="truncate text-white">{auctionAddress}</p>
                </div>
              </Snippet>
            ),
          },
          {
            name: "Token Address",
            element: (
              <Snippet hideSymbol color="primary" variant="flat">
                <div className="w-52">
                  <p className="truncate text-white">{auctionTokenAddress}</p>
                </div>
              </Snippet>
            ),
          },
          {
            name: tokensDistributed
              ? "Net Commitment (after refund)"
              : "Total Commitment",
            element:
              userCommitment !== undefined &&
              `${(+formatEther(userCommitment)).toFixed(4)} ETH`,
          },
          {
            name: tokensDistributed
              ? "Tokens Received"
              : "Tokens to Receive (Estimated)",
            element: tokensDistributed
              ? userTokenBalance !== undefined &&
                `${(+formatEther(userTokenBalance)).toFixed(4)} tokens`
              : auctionHasEnded
              ? userCommitment !== undefined &&
                auctionClearingPrice !== undefined &&
                `${Number(userCommitment / auctionClearingPrice).toFixed(
                  4,
                )} tokens`
              : userCommitment !== undefined &&
                currentAuctionPrice !== undefined &&
                `${Number(userCommitment / currentAuctionPrice).toFixed(
                  4,
                )} tokens`,
          },
        ]}
      />
      <Divider />

      {/* Auction Statistics Section */}
      <div className="space-y-5">
        {auctionStartPrice !== undefined &&
          currentAuctionPrice !== undefined &&
          auctionReservePrice !== undefined && (
            <StatCardsSection
              title="Auction Price"
              items={[
                {
                  name: "Start Price",
                  stat: auctionStartPrice,
                  unit: "ETH/token",
                },
                auctionHasEnded && auctionClearingPrice !== undefined
                  ? {
                      name: "Clearing Price",
                      stat: auctionClearingPrice,
                      unit: "ETH/token",
                      highlighted: true,
                    }
                  : {
                      name: "Current Price",
                      stat: currentAuctionPrice,
                      unit: "ETH/token",
                      highlighted: true,
                    },
                {
                  name: "Reserve Price",
                  stat: auctionReservePrice,
                  unit: "ETH/token",
                },
              ]}
            />
          )}
        {auctionTotalSupply !== undefined &&
          remainingAuctionSupply !== undefined && (
            <StatCardsSection
              title="Auction Supply"
              items={[
                {
                  name: "Total Supply",
                  stat: auctionTotalSupply,
                  unit: "tokens",
                },
                {
                  name: tokensDistributed
                    ? "Supply Burned"
                    : auctionHasEnded
                    ? "Supply to be Burned"
                    : "Remaining Supply",
                  stat: remainingAuctionSupply,
                  unit: "tokens",
                  highlighted: true,
                },
                {
                  name: tokensDistributed
                    ? "Supply Distributed"
                    : "Supply to be Distributed",
                  stat: auctionTotalSupply - remainingAuctionSupply,
                  unit: "tokens",
                },
              ]}
            />
          )}
      </div>
    </div>
  );
}

function AuctionDetailsSection({
  items,
}: {
  items: {
    name: string;
    element: React.ReactNode;
  }[];
}) {
  return (
    <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.name} className="px-4 sm:col-span-1 sm:px-0">
          <dt className="leading-6 text-gray-300">{item.name}</dt>
          <dd className="mt-2 text-lg font-medium leading-6 text-white">
            {item.element}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function StatCardsSection({
  title,
  items,
}: {
  title: string;
  items: {
    name: string;
    stat: bigint;
    unit: string;
    highlighted?: boolean;
  }[];
}) {
  return (
    <div className="space-y-2">
      <p className="text-lg font-medium text-gray-200">{title}</p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {items.map((item) => (
          <StatCard key={item.name} {...item} />
        ))}
      </div>
    </div>
  );
}

function StatCard({
  name,
  stat,
  unit,
  highlighted,
}: {
  name: string;
  stat: bigint;
  unit: string;
  highlighted?: boolean;
}) {
  return (
    <Card>
      <CardBody
        className={clsx(
          highlighted ? "bg-blue-800" : "bg-gray-800",
          "text-white",
        )}
      >
        <p className="text-sm font-medium leading-6 text-gray-300">{name}</p>
        <p className="mt-2 flex items-baseline gap-x-2">
          <span className="text-xl font-semibold tracking-tight">
            {(+formatEther(stat)).toFixed(4)}
          </span>
          <span className="text-sm text-gray-300">{unit}</span>
        </p>
      </CardBody>
    </Card>
  );
}
