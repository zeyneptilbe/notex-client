import { getInitials, getColorFromName } from "../../utils/helpers";

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
}

export function Avatar({ name, imageUrl, size = "md" }: AvatarProps) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${sizes[size]} rounded-lg object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} ${getColorFromName(
        name
      )} rounded-lg flex items-center justify-center`}
    >
      <span className="text-white font-semibold">{getInitials(name)}</span>
    </div>
  );
}
