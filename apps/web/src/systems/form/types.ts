export type Option = { value: string; label: string };

export type OptionsFn = (formValues: Record<string, unknown>) => Option[];

export type AsyncOptionsArgs = {
  search: string;
  page: number;
  limit: number;
  // The cascade parents' values keyed by field name, empty without dependsOn.
  parentValues: Record<string, unknown>;
  signal: AbortSignal;
};

export type AsyncOptionsPage = { options: Option[]; hasMore: boolean };

// One per pickable entity, owned by its feature. queryKey comes from the
// entity's <ENTITY>_KEYS.options(), so invalidating that refetches the pickers.
export type AsyncOptionsSource = {
  queryKey: readonly unknown[];
  fetch: (args: AsyncOptionsArgs) => Promise<AsyncOptionsPage>;
};

export type BaseFieldProps = {
  name: string;
  label: string;
  // Keeps the label as the accessible name while taking it off screen, for a
  // field whose purpose the layout already shows.
  hideLabel?: boolean;
  description?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  // Clears this field whenever a parent changes. With several parents it
  // stays gated until every one has a value.
  dependsOn?: string | string[];
  // A dependent field hides until its parents have values. This keeps it on
  // screen, disabled, instead.
  alwaysVisible?: boolean;
};
