"use client";

import { CiWallet } from "react-icons/ci";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@nextui-org/react";
import React from "react";
import { type BaseError } from "viem";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export function ConnectWallet({
  isOpen,
  onOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpen: () => void;
  onOpenChange: () => void;
}) {
  const { address, connector, isConnected } = useAccount();
  const { connect, connectors, error, isLoading, pendingConnector } =
    useConnect();
  const { disconnect } = useDisconnect();

  return (
    <>
      <Button
        onClick={onOpen}
        color="success"
        startContent={<CiWallet className="h-4 w-4" />}
      >
        {isConnected ? (
          <span className="w-14 truncate sm:w-20">{address}</span>
        ) : (
          "Connect Wallet"
        )}
      </Button>

      {/* Modal for Wallet Connection Options */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        backdrop="blur"
        css={{
          backgroundColor: "#000",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader css={{ color: "#fff" }}>
                Connect Your Wallet
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col space-y-3">
                  {connectors.map((connectorOption) => {
                    const isCurrentConnector =
                      connectorOption.ready &&
                      connectorOption.id === connector?.id;
                    return isCurrentConnector ? (
                      <Button
                        key={connectorOption.id}
                        onClick={() => disconnect()}
                        color="danger"
                      >
                        Disconnect {connector?.name}
                      </Button>
                    ) : (
                      <Button
                        key={connectorOption.id}
                        onClick={() => connect({ connector: connectorOption })}
                        color="primary"
                      >
                        {isLoading &&
                        connectorOption.id === pendingConnector?.id
                          ? `${connectorOption.name} (connecting...)`
                          : `Connect ${connectorOption.name}`}
                      </Button>
                    );
                  })}
                  {/* Display error message if there's an error */}
                  {error && (
                    <div className="text-red-500">
                      {(error as BaseError).shortMessage}
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onClick={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
