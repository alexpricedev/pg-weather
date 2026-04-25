import type { JSX } from "react";
import { getWeatherIconSvg } from "../services/weather-icons";

interface WeatherIconProps {
  slug: string;
  label: string;
  size?: number;
}

export const WeatherIcon = ({
  slug,
  label,
  size = 28,
}: WeatherIconProps): JSX.Element => (
  <span
    className="weather-icon"
    role="img"
    aria-label={label}
    title={label}
    style={{ width: `${size}px`, height: `${size}px` }}
    dangerouslySetInnerHTML={{ __html: getWeatherIconSvg(slug) }}
  />
);
