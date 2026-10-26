import type { IconComponent } from "@utils/types";

export const TranslateIcon: IconComponent = ({ width = 24, height = 24, className }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
        <text x="2" y="15" fontSize="15" fontFamily="sans-serif" fontWeight="600">
            A
        </text>
        <text x="12" y="21" fontSize="12" fontFamily="sans-serif" fontWeight="500">
            가
        </text>
    </svg>
);
