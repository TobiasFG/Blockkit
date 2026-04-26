export type TypographySize = "small" | "medium" | "large";

export const textSizeClasses: Record<TypographySize, string> = {
    small: "text-xs",
    medium: "text-base",
    large: "text-2xl",
};

export const headingSizeClasses: Record<TypographySize, string> = {
    small: "text-2xl",
    medium: "text-4xl",
    large: "text-6xl",
};
