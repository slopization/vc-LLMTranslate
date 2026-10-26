import { SearchableSelect, Select } from "@webpack/common";
import type { AriaAttributes, ComponentProps, ComponentType } from "react";

type NativeSelectProps = Omit<ComponentProps<typeof Select>, "aria-label" | "aria-labelledby"> &
    Pick<AriaAttributes, "aria-label" | "aria-labelledby">;

export const NativeSelect = Select as ComponentType<NativeSelectProps>;

type NativeSearchableSelectProps = Omit<ComponentProps<typeof SearchableSelect>, "aria-label" | "aria-labelledby"> &
    Pick<AriaAttributes, "aria-label" | "aria-labelledby">;

export const NativeSearchableSelect = SearchableSelect as ComponentType<NativeSearchableSelectProps>;
