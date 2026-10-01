import { THEME_CHOICES, type ThemeChoice } from "../lib/theme";

const LABELS: Record<ThemeChoice, string> = { system: "System", light: "Hell", dark: "Dunkel" };

interface Props {
  value: ThemeChoice;
  onChange: (value: ThemeChoice) => void;
}

export function ThemeToggle({ value, onChange }: Props) {
  return (
    <fieldset className="segmented">
      <legend>Darstellung</legend>
      {THEME_CHOICES.map((choice) => (
        <label key={choice}>
          <input
            type="radio"
            name="theme"
            value={choice}
            checked={value === choice}
            onChange={() => onChange(choice)}
          />
          <span>{LABELS[choice]}</span>
        </label>
      ))}
    </fieldset>
  );
}
