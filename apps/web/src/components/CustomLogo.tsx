import { clsx } from "clsx";
import Image from "next/image";
import { type HTMLAttributes } from "react";

export function CustomLogo({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-lg bg-gray-900 p-4",
        className,
      )}
      {...props}
    >
      <Image
        src="/logo.svg"
        alt="icon"
        fill
        style={{ objectFit: "contain", borderRadius: "50%" }}
      />
    </div>
  );
}
