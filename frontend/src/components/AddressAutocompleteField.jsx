import { useEffect, useRef, useState } from "react";
import {
  createAddressSessionToken,
  fetchAddressSuggestions,
  isAddressAutocompleteEnabled,
  retrieveAddressSuggestion,
} from "../lib/addressSearch";

export default function AddressAutocompleteField({
  label,
  value,
  onValueChange,
  onLocationSelect,
  placeholder,
  required = false,
  error = "",
  hint = "",
  className = "",
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [searchState, setSearchState] = useState({
    loading: false,
    error: "",
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const sessionTokenRef = useRef(createAddressSessionToken());
  const containerRef = useRef(null);
  const suppressNextLookupRef = useRef(false);
  const autocompleteEnabled = isAddressAutocompleteEnabled();

  useEffect(() => {
    if (suppressNextLookupRef.current) {
      suppressNextLookupRef.current = false;
      return undefined;
    }

    if (!autocompleteEnabled || !value?.trim()) {
      setSuggestions([]);
      setSearchState({ loading: false, error: "" });
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setSearchState({ loading: true, error: "" });
        const nextSuggestions = await fetchAddressSuggestions(value, {
          sessionToken: sessionTokenRef.current,
        });
        setSuggestions(nextSuggestions);
        setShowSuggestions(true);
        setSearchState({ loading: false, error: "" });
      } catch (requestError) {
        setSuggestions([]);
        setSearchState({
          loading: false,
          error: requestError.message || "Address suggestions are unavailable.",
        });
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [autocompleteEnabled, value]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleInputChange = (nextValue) => {
    onValueChange(nextValue);
    onLocationSelect(null);
  };

  const handleSuggestionSelect = async (suggestion) => {
    try {
      setSearchState({ loading: true, error: "" });
      const location = await retrieveAddressSuggestion(suggestion.mapbox_id, {
        sessionToken: sessionTokenRef.current,
      });

      suppressNextLookupRef.current = true;
      onValueChange(location?.address || suggestion.full_address || suggestion.name || value);
      onLocationSelect(location);
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchState({ loading: false, error: "" });
      sessionTokenRef.current = createAddressSessionToken();
    } catch (requestError) {
      setSearchState({
        loading: false,
        error: requestError.message || "We could not use that address suggestion.",
      });
    }
  };

  return (
    <div className={className} ref={containerRef}>
      <label className="block text-sm font-semibold text-[#2a4128]">
        {label}
      </label>
      <div className="relative mt-3">
        <input
          required={required}
          value={value}
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          className={`w-full rounded-xl border bg-[#fbfdf7] px-4 py-3 text-on-surface outline-none transition focus:border-primary ${
            error ? "border-red-300" : "border-[#d8e2d2]"
          }`}
          placeholder={placeholder}
          autoComplete="street-address"
        />

        {autocompleteEnabled && showSuggestions && (suggestions.length > 0 || searchState.loading) && (
          <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-[#d8e2d2] bg-white p-2 shadow-level-2">
            {searchState.loading ? (
              <div className="px-3 py-2 text-sm text-[#5f6d5b]">Searching addresses...</div>
            ) : (
              suggestions.map((suggestion) => (
                <button
                  key={suggestion.mapbox_id}
                  type="button"
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-[#f4faea]"
                >
                  <p className="text-sm font-semibold text-[#1d3720]">
                    {suggestion.name || suggestion.full_address}
                  </p>
                  <p className="mt-0.5 text-xs text-[#6a7768]">
                    {suggestion.full_address || suggestion.place_formatted || suggestion.address}
                  </p>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {hint ? <p className="mt-2 text-xs leading-5 text-[#6a7768]">{hint}</p> : null}
      {!autocompleteEnabled ? (
        <p className="mt-2 text-xs leading-5 text-[#6a7768]">
          Add `VITE_MAPBOX_ACCESS_TOKEN` to enable live address suggestions and save precise map coordinates.
        </p>
      ) : null}
      {searchState.error ? (
        <p className="mt-2 text-sm text-amber-700">{searchState.error}</p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
