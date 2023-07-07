import { FC } from "react";

export const Link: FC<{ link: string; label: string }> = ({ link, label }) => {
  return (
    <a href={link} className="text-blue-400 underline" target="_blank">
      {label}
    </a>
  );
};
