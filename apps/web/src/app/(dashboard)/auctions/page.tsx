"use client";

import { IoIosRefresh } from "react-icons/io";

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Checkbox,
  Chip,
  Divider,
  useDisclosure,
} from "@nextui-org/react";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { useAccount } from "wagmi";

import { CreateAuction } from "@/components/CreateAuction";
import {
  useAuctionFactoryGetAllAuctions,
  useAuctionFactoryGetAuctionsByCreator,
  useAuctionTokenName,
  useAuctionTokenSymbol,
  useDutchAuctionGetAuctionEnded,
  useDutchAuctionGetDuration,
  useDutchAuctionGetStartTime,
  useDutchAuctionGetToken,
  useDutchAuctionGetTokensDistributed,
} from "@/generated";
import { useCountdown } from "@/hooks/use-countdown";
import { formatCountdown } from "@/lib/utils/countdown";

const TokenAndSymbol = ({
  contractAddress,
}: {
  contractAddress: `0x${string}`;
}) => {
  const { data: tokenAddress } = useDutchAuctionGetToken({
    address: contractAddress,
  });

  const { data: tokenName } = useAuctionTokenName({
    address: tokenAddress,
  });
  const { data: tokenSymbol } = useAuctionTokenSymbol({
    address: tokenAddress,
  });

  return (
    <div className="flex flex-col space-y-2 rounded-lg bg-gray-800 p-4 shadow-md">
      <div className="flex items-center">
        <h3 className="text-lg font-bold text-gray-400">Token:</h3>
        <p className="ml-2 text-lg font-semibold text-white">
          {tokenName || "Token Name"}
        </p>
      </div>
      <div className="flex items-center">
        <h3 className="text-lg font-bold text-gray-400">Symbol:</h3>
        <p className="ml-2 text-lg font-semibold text-white">
          {tokenSymbol || "SYM"}
        </p>
      </div>
    </div>
  );
};

export default function AuctionsPage() {
  const [showUserAuctions, setShowUserAuctions] = useState(false);
  const { address: userAddress } = useAccount();

  // Modal control for creating auctions
  const {
    isOpen: isModalOpen,
    onOpen: openModal,
    onOpenChange: toggleModal,
  } = useDisclosure();

  // Fetch all auctions
  const { data: allAuctions, refetch: refetchAll } =
    useAuctionFactoryGetAllAuctions();

  // Fetch auctions created by the current user
  const { data: userAuctions, refetch: refetchUser } =
    useAuctionFactoryGetAuctionsByCreator({
      args: [userAddress as `0x${string}`],
    });

  // Choose data to display based on the state
  const auctionsToDisplay = showUserAuctions ? userAuctions : allAuctions;

  // Refetch function based on the current view
  const refetchAuctions = () => {
    if (showUserAuctions) {
      refetchUser();
    } else {
      refetchAll();
    }
  };

  return (
    <div className="space-y-5">
      <header className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-foreground text-2xl font-bold leading-7 sm:truncate sm:text-3xl sm:tracking-tight">
            Auction Listings
          </h2>
        </div>
        <div className="mt-4 flex flex-shrink-0 gap-2 md:ml-4 md:mt-0">
          <Button
            onClick={refetchAuctions}
            startContent={<IoIosRefresh className="h-4 w-4" />}
            className="bg-blue-500 text-white hover:bg-blue-600" // Custom background color
          >
            Refresh
          </Button>
          <CreateAuction
            isOpen={isModalOpen}
            onOpen={openModal}
            onOpenChange={toggleModal}
          />
        </div>
      </header>
      {/* Checkbox to toggle between all auctions and user's auctions */}
      <Checkbox
        isSelected={showUserAuctions}
        onValueChange={setShowUserAuctions}
      >
        Show my auctions
      </Checkbox>
      {/* List of auctions */}
      <ul className="space-y-6">
        {auctionsToDisplay !== undefined && auctionsToDisplay.length > 0 ? (
          auctionsToDisplay
            .slice()
            .reverse()
            .map((auctionAddress) => (
              <AuctionCard
                key={auctionAddress}
                contractAddress={auctionAddress}
              />
            ))
        ) : (
          <Card>
            <CardBody>There is no auctions</CardBody>
          </Card>
        )}
      </ul>
    </div>
  );
}

function AuctionCard({ contractAddress }: { contractAddress: `0x${string}` }) {
  // Fetch static auction data
  const { data: startTime } = useDutchAuctionGetStartTime({
    address: contractAddress,
  });
  const startDate = useMemo(() => {
    return startTime ? new Date(Number(startTime) * 1000) : new Date();
  }, [startTime]);

  const { data: auctionDuration } = useDutchAuctionGetDuration({
    address: contractAddress,
  });

  // Fetch dynamic auction data
  const { data: isTokensDistributed } = useDutchAuctionGetTokensDistributed({
    address: contractAddress,
  });
  const { data: hasAuctionEnded } = useDutchAuctionGetAuctionEnded({
    address: contractAddress,
  });

  // Countdown timer
  const { minutes, seconds } = useCountdown(startDate, Number(auctionDuration));

  return (
    <Card as="li">
      <CardBody>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <TokenAndSymbol contractAddress={contractAddress} />

          <div className="flex flex-col items-end gap-2">
            {!hasAuctionEnded ? (
              <>
                <div className="inline-block rounded-xl bg-yellow-600 px-3 py-1 text-black">
                  Auction In Progress
                </div>
              </>
            ) : (
              <>
                {isTokensDistributed && (
                  <div className="inline-block rounded-xl bg-green-700 px-3 py-1 text-white">
                    Tokens Distributed
                  </div>
                )}
                <div className="inline-block rounded-xl bg-red-700 px-3 py-1 text-white">
                  Auction Ended
                </div>
              </>
            )}

            <div className="mt-2 rounded-xl bg-gray-800 p-2 text-sm text-gray-300">
              {contractAddress}
            </div>
          </div>
        </div>

        {(minutes !== 0 || seconds !== 0) && (
          <div className="ml-2 mt-2">
            <div className="text-md pxtext-medium my-6 inline-block rounded-xl">
              {formatCountdown({
                minutes,
                seconds,
              })}
            </div>
          </div>
        )}
      </CardBody>
      <Divider />
      <CardFooter className="flex justify-center">
        <Button
          as={Link}
          href={`/auctions/${contractAddress}`}
          className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
        >
          View Auction
        </Button>
      </CardFooter>
    </Card>
  );
}
