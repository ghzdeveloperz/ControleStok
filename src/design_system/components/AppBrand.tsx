import logoAndNameImage from "../../../assets/images/logo-and-name.png";

export interface AppBrandProps {
  readonly className?: string;
  readonly imageClassName?: string;
}

export const AppBrand = ({
  className = "",
  imageClassName = "",
}: AppBrandProps) => {
  const rootClassName = ["msd-brand", className].filter(Boolean).join(" ");
  const imageFinalClassName = ["msd-brand__image", imageClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClassName} aria-label="MyStoreDay">
      <img
        src={logoAndNameImage}
        alt="MyStoreDay"
        className={imageFinalClassName}
      />
    </div>
  );
};
