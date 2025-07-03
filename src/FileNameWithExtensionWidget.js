import React from "react";

export default function FileNameWithExtensionWidget({
  value,
  onChange,
  required,
  options
}) {
  const extension = options.extension || "";

  const handleChange = (e) => {
    const escapedExtension = extension.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const input = e.target.value.replace(new RegExp(`${escapedExtension}$`, "i"), "");
    onChange(input);
  };

  return (
    <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
      <input
        type="text"
        value={value || ""}
        onChange={handleChange}
        required={required}
        style={{
          paddingRight: 50, // make room for suffix text
          boxSizing: "border-box",
          width: "100%"
        }}
        placeholder={`Enter name (without ${extension})`}
      />
      <span
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          color: "#555",
          pointerEvents: "none",
          userSelect: "none",
          fontSize: "0.9em",
          fontFamily: "sans-serif"
        }}
      >
        {extension}
      </span>
    </div>
  );
}
