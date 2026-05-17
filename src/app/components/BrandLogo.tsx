import logoDanivisual from "../../../asset/logo_danivisual.png";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  inverted?: boolean;
};

export default function BrandLogo({ className = "", imageClassName = "", inverted = false }: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <img
        src={logoDanivisual}
        alt="Danivisual"
        className={`object-contain ${inverted ? "brightness-0 invert" : ""} ${imageClassName}`}
      />
    </span>
  );
}
