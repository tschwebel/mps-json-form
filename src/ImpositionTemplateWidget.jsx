import React, { useState, useEffect } from "react";
import CreatableSelect from "react-select/creatable";

function ImpositionTemplateWidget({ value, onChange }) {
  const [inputValue, setInputValue] = useState("");
  const [groupedOptions, setGroupedOptions] = useState([]);

  // Load templates.json once on mount
  useEffect(() => {
    fetch("/templates.json")
      .then((res) => res.json())
      .then((data) => {
        // Convert JSON to react-select grouped options format
        const options = Object.entries(data).map(([groupLabel, files]) => ({
          label: groupLabel,
          options: files.map((file) => ({
            value: file,
            label: file
          }))
        }));
        setGroupedOptions(options);
      })
      .catch((err) => {
        console.error("Error loading templates.json", err);
      });
  }, []);

  // Find selected option in loaded groups or treat as custom
  const findSelectedOption = (val) => {
    if (!val) return null;
    for (const group of groupedOptions) {
      const found = group.options.find((opt) => opt.value === val);
      if (found) return found;
    }
    return { value: val, label: val };
  };

  const selectedOption = findSelectedOption(value);

  const handleChange = (selected) => {
    if (!selected) {
      onChange("");
      return;
    }
    onChange(selected.value);
  };

  const handleInputChange = (newValue) => {
    setInputValue(newValue);
  };

  const handleKeyDown = (event) => {
    if (!inputValue) return;
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      let val = inputValue.trim();
      if (val && !val.toLowerCase().endsWith(".pdf")) {
        val += ".pdf";
      }
      onChange(val);
      setInputValue("");
    }
  };

  return (
    <CreatableSelect
      isClearable
      onChange={handleChange}
      onInputChange={handleInputChange}
      onKeyDown={handleKeyDown}
      options={groupedOptions}
      value={selectedOption}
      inputValue={inputValue}
      placeholder="Select or type a template..."
      isDisabled={groupedOptions.length === 0}
      noOptionsMessage={() =>
        groupedOptions.length === 0 ? "Loading templates..." : "No options"
      }
    />
  );
}

export default ImpositionTemplateWidget;
