import { useState } from "react";
import { t } from "../i18n";
import { formatEuro, formatHolidayDate, formatHoursPerDay } from "../lib/format";
import { STATE_CODES, STATE_NAMES, type StateCode } from "../lib/holidays";
import {
  MAX_MONTHS,
  MIN_MONTHS,
  type IncomeMode,
  type SettingsDraft,
  type SettingsField,
  type SettingsOutcome,
} from "../lib/settings";

const ALL_FIELDS: SettingsField[] = ["net", "monthsPerYear", "weeklyHours", "workdays", "vacationDays"];

interface Props {
  draft: SettingsDraft;
  /** The evaluated Gehaltsdaten: field errors, or the summary once they are usable. */
  outcome: SettingsOutcome;
  /** Show every field's error at once (the app started with the user's own data); otherwise only after blur. */
  revealErrors: boolean;
  onChange: (draft: SettingsDraft) => void;
}

export function SettingsForm({ draft, outcome, revealErrors, onChange }: Props) {
  const [touched, setTouched] = useState<Set<SettingsField>>(() => new Set(revealErrors ? ALL_FIELDS : []));
  const touch = (...fields: SettingsField[]) =>
    setTouched((current) => new Set([...current, ...fields]));
  const errors = outcome.ok ? {} : outcome.errors;
  const shown = (field: SettingsField) => (touched.has(field) ? errors[field] : undefined);
  const set = <K extends keyof SettingsDraft>(key: K, value: SettingsDraft[K]) =>
    onChange({ ...draft, [key]: value });

  const netLabel = draft.mode === "monthly" ? t.settings.netLabelMonthly : t.settings.netLabelYearly;
  const info = outcome.ok ? outcome.info : null;

  function toggleDay(day: number) {
    // Fewer workdays can leave no working day after vacation; that error shows at the vacation field.
    touch("workdays", "vacationDays");
    set("workdays", draft.workdays.includes(day) ? draft.workdays.filter((d) => d !== day) : [...draft.workdays, day]);
  }

  return (
    <section aria-labelledby="settings-title" className="card">
      <h2 id="settings-title">{t.settings.title}</h2>
      <p className="muted">{t.settings.intro}</p>

      <fieldset className="segmented wide">
        <legend>{t.settings.modeLegend}</legend>
        {(["monthly", "yearly"] as IncomeMode[]).map((mode) => (
          <label key={mode}>
            <input
              type="radio"
              name="mode"
              value={mode}
              checked={draft.mode === mode}
              onChange={() => set("mode", mode)}
            />
            <span>{mode === "monthly" ? t.settings.monthly : t.settings.yearly}</span>
          </label>
        ))}
      </fieldset>

      <div className="field">
        <label htmlFor="net">{netLabel}</label>
        <div className="input-affix">
          <input
            id="net"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={draft.net}
            onChange={(e) => set("net", e.target.value)}
            onBlur={() => touch("net")}
            aria-invalid={shown("net") !== undefined}
            aria-describedby="net-error"
          />
          {/* Decorative: the label already says "in Euro". */}
          <span className="affix" aria-hidden="true">
            {t.settings.netUnit}
          </span>
        </div>
        <p id="net-error" className="error">
          {shown("net")}
        </p>
      </div>

      {draft.mode === "monthly" && (
        <div className="field">
          <label htmlFor="months">
            {t.settings.monthsLabel} <strong>{draft.monthsPerYear}</strong>
          </label>
          <input
            id="months"
            type="range"
            min={MIN_MONTHS}
            max={MAX_MONTHS}
            step={1}
            value={draft.monthsPerYear}
            onChange={(e) => set("monthsPerYear", Number(e.target.value))}
          />
        </div>
      )}

      <div className="field">
        <label htmlFor="weekly-hours">{t.settings.weeklyHoursLabel}</label>
        <input
          id="weekly-hours"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={draft.weeklyHours}
          onChange={(e) => set("weeklyHours", e.target.value)}
          onBlur={() => touch("weeklyHours")}
          aria-invalid={shown("weeklyHours") !== undefined}
          aria-describedby="weekly-hours-error"
        />
        <p id="weekly-hours-error" className="error">
          {shown("weeklyHours")}
        </p>
      </div>

      <fieldset className="field days" aria-describedby="workdays-error">
        <legend>{t.settings.workdaysLegend}</legend>
        <div className="day-list">
          {t.weekdays.map((day) => (
            <label key={day.value} className="day">
              <input
                type="checkbox"
                checked={draft.workdays.includes(day.value)}
                onChange={() => toggleDay(day.value)}
                aria-label={day.label}
              />
              <span aria-hidden="true">{day.short}</span>
            </label>
          ))}
        </div>
        <p id="workdays-error" className="error">
          {shown("workdays")}
        </p>
      </fieldset>

      <div className="field">
        <label htmlFor="vacation">{t.settings.vacationLabel}</label>
        <input
          id="vacation"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={draft.vacationDays}
          onChange={(e) => set("vacationDays", e.target.value)}
          onBlur={() => touch("vacationDays")}
          aria-invalid={shown("vacationDays") !== undefined}
          aria-describedby="vacation-error"
        />
        <p id="vacation-error" className="error">
          {shown("vacationDays")}
        </p>
      </div>

      <div className="field">
        <label htmlFor="state">{t.settings.stateLabel}</label>
        <select
          id="state"
          value={draft.state}
          onChange={(e) => {
            // Other holidays can leave no working day after vacation; that error shows at the vacation field.
            touch("vacationDays");
            set("state", e.target.value as StateCode);
          }}
        >
          {STATE_CODES.map((code) => (
            <option key={code} value={code}>
              {STATE_NAMES[code]}
            </option>
          ))}
        </select>
      </div>

      {info && (
        <div className="summary" aria-live="polite">
          <h3>{t.settings.summaryTitle(info.year)}</h3>
          <dl>
            <dt>{t.settings.annualNet}</dt>
            <dd>{formatEuro(info.annualNet)}</dd>
            <dt>{t.settings.workingDaysPerYear}</dt>
            <dd>{info.workingDaysPerYear}</dd>
            <dt>{t.settings.hoursPerDay}</dt>
            <dd>{formatHoursPerDay(info.hoursPerDay)}</dd>
            <dt>{t.settings.hourlyWage}</dt>
            <dd>{formatEuro(info.hourlyWage)}</dd>
          </dl>
          <details>
            <summary>{t.settings.holidaysSummary(info.allHolidays.length, info.holidaysOnWorkdays.length)}</summary>
            <ul className="holidays">
              {info.allHolidays.map((h) => (
                <li key={`${h.name}-${h.date.getTime()}`} className={h.onWorkday ? undefined : "off-day"}>
                  {t.settings.holidayLine(formatHolidayDate(h.date), h.name)}
                  {!h.onWorkday && <span className="note">{t.settings.holidayOffDay}</span>}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </section>
  );
}
