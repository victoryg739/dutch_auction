"use client";

import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";
import { parseEther, formatEther } from "viem";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@nextui-org/react";
import { ArrowPathIcon } from "@heroicons/react/20/solid";

import { useDutchAuctionPlaceBid } from "@/generated";

// Define the bid validation schema
const bidValidationSchema = z.object({
  bidAmount: z
    .number()
    .positive("Bid amount must be greater than zero")
    .refine(
      (value) => {
        try {
          parseEther(value.toString());
          return true;
        } catch {
          return false;
        }
      },
      {
        message: "Invalid Ether amount",
      },
    ),
});

export function BidModal({
  isOpen,
  onOpen,
  onOpenChange,
  contractAddress,
  currentPrice,
  auctionEnded,
  remainingSupply,
  refetch,
}) {
  // Function to handle form submission
  const handleBidSubmission = async (formData) => {
    try {
      await executeBid({
        value: parseEther(formData.bidAmount.toString()),
      });
    } catch (error) {
      toast.error("Failed to place bid");
    }
  };

  // Hook to execute a bid in the auction
  const { writeAsync: executeBid } = useDutchAuctionPlaceBid({
    address: contractAddress,
    onSuccess() {
      toast.success("Your bid has been placed!");
      formReset();
      refetch();
    },
  });

  // Set up form handling with react-hook-form and zod validation
  const {
    register: formRegister,
    handleSubmit: formHandleSubmit,
    reset: formReset,
    watch: formWatch,
    formState: {
      errors: formErrors,
      isValid: formIsValid,
      isSubmitting: formIsSubmitting,
    },
  } = useForm({
    resolver: zodResolver(bidValidationSchema),
    defaultValues: {
      bidAmount: 0,
    },
  });

  const enteredBidAmount = formWatch("bidAmount");

  return (
    <>
      <Button color="primary" onPress={onOpen}>
        Submit Bid
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <form onSubmit={formHandleSubmit(handleBidSubmission)}>
            <ModalHeader>
              <h3>Submit Your Bid</h3>
            </ModalHeader>
            <ModalBody>
              <Input
                {...formRegister("bidAmount", { valueAsNumber: true })}
                label="Bid Amount (ETH)"
                placeholder="Enter bid amount"
                type="number"
                step="any"
                errorMessage={formErrors.bidAmount?.message}
                isDisabled={auctionEnded}
                description={
                  !auctionEnded && currentPrice
                    ? `You may receive approximately ${
                        isNaN(enteredBidAmount / +formatEther(currentPrice))
                          ? 0
                          : (
                              enteredBidAmount / +formatEther(currentPrice)
                            ).toFixed(3)
                      } tokens`
                    : "Auction has ended"
                }
              />
            </ModalBody>
            <ModalFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="light"
                onPress={refetch}
                icon={<ArrowPathIcon className="h-4 w-4" />}
              >
                Refresh Data
              </Button>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="light"
                  color="error"
                  onPress={onOpenChange}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  color="success"
                  isDisabled={!formIsValid || auctionEnded}
                  isLoading={formIsSubmitting}
                >
                  Confirm Bid
                </Button>
              </div>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}
