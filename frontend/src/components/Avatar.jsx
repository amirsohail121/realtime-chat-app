import React from "react";
import { IoPersonCircleOutline } from "react-icons/io5";

const Avatar = ({ src, size = 40, isGroup = false, alt = "avatar" }) => {
  const iconSize = Math.max(12, Math.floor(size * 0.6));
  const style = { width: size, height: size };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        style={style}
        className="rounded-full object-cover"
      />
    );
  }

  return (
    <div
      style={style}
      className="rounded-full bg-slate-200 text-slate-400 flex items-center justify-center"
    >
      <IoPersonCircleOutline size={iconSize} />
    </div>
  );
};

export default Avatar;
