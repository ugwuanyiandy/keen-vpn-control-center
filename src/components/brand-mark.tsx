import Image from "next/image";

export function BrandMark({ variant = "auth" }: { variant?: "auth" | "app" }) {
  return (
    <span
      className={variant === "app" ? "app-brand-mark" : "brand-mark"}
      aria-hidden="true"
    >
      <Image
        className="brand-logo-image"
        src="/keenvpn-mark.svg"
        alt=""
        width={30}
        height={30}
      />
    </span>
  );
}
