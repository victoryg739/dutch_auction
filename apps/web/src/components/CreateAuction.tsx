"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@nextui-org/react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { parseEther } from "viem";
import { MdStart } from "react-icons/md";

import { useAuctionFactoryCreateAuction } from "@/generated";

export function CreateAuction({
  isOpen,
  onOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpen: () => void;
  onOpenChange: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    mode: "onChange", // Update form state on every change
    defaultValues: {
      name: "",
      symbol: "",
      totalSupply: 1000,
      startPrice: 1,
      reservedPrice: 0.5,
    },
  });

  const { write: createAuction } = useAuctionFactoryCreateAuction({
    onSuccess() {
      toast.success("Auction successfully created");
      reset();
    },
  });

  return (
    <>
      <Button
        color="primary"
        onClick={onOpen}
        startContent={<MdStart className="h-4 w-4" />}
      >
        Start Auction
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        backdrop="blur"
        css={{
          backgroundColor: "#000", // Set modal background to black
        }}
      >
        <ModalContent>
          {(onClose) => (
            <form
              onSubmit={handleSubmit((formData) => {
                createAuction({
                  args: [
                    formData.name,
                    formData.symbol,
                    parseEther(String(formData.totalSupply)),
                    parseEther(String(formData.startPrice)),
                    parseEther(String(formData.reservedPrice)),
                  ],
                });
              })}
            >
              <ModalHeader css={{ color: "#fff" }}>
                Create New Auction
              </ModalHeader>
              <ModalBody>
                <Input
                  label="Token Name"
                  labelPlacement="outside"
                  placeholder="Enter token name"
                  errorMessage={errors.name?.message}
                  {...register("name", {
                    required: "Token Name is required",
                  })}
                />
                <Input
                  label="Token Symbol"
                  labelPlacement="outside"
                  placeholder="Enter token symbol"
                  errorMessage={errors.symbol?.message}
                  {...register("symbol", {
                    required: "Token Symbol is required",
                  })}
                />
                <Input
                  type="number"
                  label="Total Supply"
                  labelPlacement="outside"
                  placeholder="1000"
                  endContent={
                    <span className="text-default-400 text-small">tokens</span>
                  }
                  errorMessage={errors.totalSupply?.message}
                  {...register("totalSupply", {
                    required: "Total Supply is required",
                    valueAsNumber: true,
                    min: {
                      value: 1,
                      message: "Total Supply must be a positive integer",
                    },
                    validate: (value) =>
                      Number.isInteger(value) ||
                      "Total Supply must be an integer",
                  })}
                />
                <Input
                  type="number"
                  step="any"
                  label="Start Price (ETH)"
                  labelPlacement="outside"
                  placeholder="1"
                  endContent={
                    <span className="text-default-400 text-small">ETH</span>
                  }
                  errorMessage={errors.startPrice?.message}
                  {...register("startPrice", {
                    required: "Start Price is required",
                    valueAsNumber: true,
                    min: {
                      value: 0.00000001,
                      message: "Start Price must be positive",
                    },
                  })}
                />
                <Input
                  type="number"
                  step="any"
                  label="Reserved Price (ETH)"
                  labelPlacement="outside"
                  placeholder="0.5"
                  endContent={
                    <span className="text-default-400 text-small">ETH</span>
                  }
                  errorMessage={errors.reservedPrice?.message}
                  {...register("reservedPrice", {
                    required: "Reserved Price is required",
                    valueAsNumber: true,
                    min: {
                      value: 0.00000001,
                      message: "Reserved Price must be positive",
                    },
                  })}
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  type="button"
                  color="error"
                  variant="flat"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isDisabled={!isValid}
                  isLoading={isSubmitting}
                  color="success"
                >
                  Create Auction
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
