"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { submitReport } from "@/app/actions";
import { clockRo, countRo, telHref } from "@/lib/format";
import { shareLinks, shareText } from "@/lib/site";
import type { ReportOutcome } from "@/server/report";

import { ServiceIcon } from "./icons";
import { StatusBadge } from "./status-badge";

type Option = {
  slug: string;
  name: string;
};

type ServiceOption = Option & {
  slug: "apa" | "curent" | "gaz" | "caldura";
  // „apă”, „curent”, „gaz”, „căldură”, pentru textul de partajare
  noun: string;
  provider: string;
  phone: string;
  phoneNote: string;
};

// Datele unui oraș pentru formular; zone/service precompletează după pagina pe care ești.
export type CityReport = {
  city: Option;
  zones: Option[];
  services: ServiceOption[];
  zone?: string;
  service?: string;
};

// Cu un singur oraș, panoul începe direct cu formularul; cu mai multe (pagina principală), întreabă
// întâi orașul.
export type ReportDialogProps = {
  label: string;
  cities: CityReport[];
};

const clock = (iso: string): string => clockRo(new Date(iso));

const DIALOG_ID = "raporteaza";

const SLOW_AFTER_MS = 4000;

const noSubscription = (): (() => void) => () => undefined;

// false în HTML-ul de pe server și până se încarcă JavaScript-ul; true după aceea.
function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}

// Comenzi native pentru dialog (commandfor/command): butonul deschide și închide panoul chiar
// înainte să se încarce JavaScript-ul, pe o rețea lentă. Tipurile React nu le cunosc încă.
type NativeCommand = {
  commandfor: string;
  command: "show-modal" | "close";
};

function nativeCommand(command: NativeCommand["command"]): NativeCommand {
  return { commandfor: DIALOG_ID, command };
}

const supportsCommands = (): boolean => "command" in HTMLButtonElement.prototype;

function rememberedZoneKey(city: string): string {
  return `avariiacum:${city}:cartier`;
}

function readRememberedZone(city: string): string | null {
  try {
    return window.localStorage.getItem(rememberedZoneKey(city));
  } catch {
    return null;
  }
}

function rememberZone(city: string, zone: string): void {
  try {
    window.localStorage.setItem(rememberedZoneKey(city), zone);
  } catch {
    // Fără stocare locală (navigare privată): raportarea merge oricum.
  }
}

const people = (count: number): string => countRo(count, { one: "persoană a raportat", many: "persoane au raportat" });

function Thanks({ outcome, props, onClose }: { outcome: Extract<ReportOutcome, { status: "trimis" }>; props: CityReport; onClose: () => void }) {
  const zone = props.zones.find((candidate) => candidate.slug === outcome.zone);
  const service = props.services.find((candidate) => candidate.slug === outcome.service);
  const [shared, setShared] = useState<string | null>(null);
  const zoneUrl = `/${props.city.slug}/${outcome.zone}/`;
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  if (!zone || !service) {
    return null;
  }

  const links = shareLinks(`${origin}${zoneUrl}`, shareText(service.noun, zone.name, props.city.name, outcome.reporters));

  async function share(): Promise<void> {
    const url = new URL(zoneUrl, window.location.origin).toString();
    const title = `${service?.name} în ${zone?.name}, ${props.city.name}: Avarii Acum`;

    try {
      if (navigator.share) {
        await navigator.share({ title, url });

        return;
      }

      await navigator.clipboard.writeText(url);
      setShared("Linkul e copiat. Trimite-l vecinilor.");
    } catch {
      setShared(`Linkul: ${url}`);
    }
  }

  return (
    <div className="done" role="status">
      <div className="sheet-head">
        <h2 id="raport-titlu">Raport trimis. Mulțumim.</h2>
        <button type="button" className="x" aria-label="Închide" {...nativeCommand("close")} onClick={onClose}>
          ×
        </button>
      </div>
      <div className="panel now">
        <div className="row-top">
          <span className="row-title">
            <ServiceIcon slug={service.slug} />
            {`${service.name} în ${zone.name}`}
          </span>
          {outcome.reporters >= 3 ? <StatusBadge status="avarie">Probabil avarie</StatusBadge> : null}
        </div>
        <p className="small">{`${people(outcome.reporters)} în ultima oră, inclusiv tu.`}</p>
      </div>
      <div className="provider-inline">
        <p className="small muted">{`Nu suntem ${service.provider}. Ca să afle și ei, sună la dispecerat:`}</p>
        <a className="num" href={telHref(service.phone)}>
          {service.phone}
        </a>
        <p className="small muted">{service.phoneNote}</p>
      </div>
      <div className="btns">
        <a className="btn btn-primary btn-wide" href={zoneUrl}>
          {`Vezi situația din ${zone.name}`}
        </a>
        <button type="button" className="btn btn-wide" onClick={share}>
          Trimite linkul vecinilor
        </button>
        {shared ? <p className="small">{shared}</p> : null}
        <div className="share">
          <a className="btn" href={links.whatsapp} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
          <a className="btn" href={links.facebook} target="_blank" rel="noopener noreferrer">
            Facebook
          </a>
        </div>
      </div>
      <p className="fine">{`Poți raporta din nou ${service.name.toLowerCase()} în ${zone.name} după ora ${clock(outcome.retryAfter)}.`}</p>
    </div>
  );
}

function ReportForm({ props, onClose, onChangeCity }: { props: CityReport; onClose: () => void; onChangeCity?: () => void }) {
  const [outcome, action, pending] = useActionState(submitReport, null);
  const [zone, setZone] = useState(props.zone ?? "");
  const [slow, setSlow] = useState(false);
  const hydrated = useHydrated();

  useEffect(() => {
    if (!pending) {
      setSlow(false);

      return;
    }

    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);

    return () => clearTimeout(timer);
  }, [pending]);

  useEffect(() => {
    if (props.zone) {
      return;
    }

    const remembered = readRememberedZone(props.city.slug);

    if (remembered && props.zones.some((candidate) => candidate.slug === remembered)) {
      setZone(remembered);
    }
  }, [props.city.slug, props.zone, props.zones]);

  useEffect(() => {
    if (outcome?.status === "trimis") {
      rememberZone(props.city.slug, outcome.zone);
    }
  }, [outcome, props.city.slug]);

  if (outcome?.status === "trimis") {
    return <Thanks outcome={outcome} props={props} onClose={onClose} />;
  }

  const tooEarly = outcome?.status === "prea-devreme" ? outcome : null;

  return (
    <form action={action} className="report-form">
      <div className="sheet-head">
        <h2 id="raport-titlu">Ce nu funcționează?</h2>
        <button type="button" className="x" aria-label="Închide" {...nativeCommand("close")} onClick={onClose}>
          ×
        </button>
      </div>
      {onChangeCity ? (
        <p className="city-picked">
          {`Orașul: ${props.city.name}`}
          <button type="button" className="link-button" onClick={onChangeCity}>
            Schimbă orașul
          </button>
        </p>
      ) : null}
      <input type="hidden" name="oras" value={props.city.slug} />
      <div className="field">
        <label className="label" htmlFor="raport-cartier">
          Cartierul
        </label>
        <select id="raport-cartier" name="cartier" required value={zone} onChange={(event) => setZone(event.target.value)}>
          <option value="" disabled>
            Alege cartierul
          </option>
          {props.zones.map((candidate) => (
            <option key={candidate.slug} value={candidate.slug}>
              {`${candidate.name}, ${props.city.name}`}
            </option>
          ))}
        </select>
      </div>
      <fieldset className="field">
        <legend className="label">Serviciul</legend>
        <div className="tiles">
          {props.services.map((candidate) => (
            <label key={candidate.slug} className="tile">
              <input type="radio" name="serviciu" value={candidate.slug} required defaultChecked={candidate.slug === props.service} />
              <ServiceIcon slug={candidate.slug} size={28} />
              <span>{candidate.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {tooEarly ? (
        <p className="notice" role="alert">
          {`Ai raportat deja ${props.services.find((candidate) => candidate.slug === tooEarly.service)?.name.toLowerCase() ?? "acest serviciu"} în acest cartier. Poți raporta din nou după ora ${clock(tooEarly.retryAfter)}.`}
        </p>
      ) : null}
      {outcome?.status === "eroare" ? (
        <p className="notice" role="alert">
          Nu am putut salva raportul. Încearcă din nou peste un minut.
        </p>
      ) : null}
      {outcome?.status === "invalid" ? (
        <p className="notice" role="alert">
          Alege cartierul și serviciul.
        </p>
      ) : null}
      <p className="fine">Raportul e anonim: nu cerem nume, telefon sau locație. Poți raporta același serviciu o dată la 2 ore.</p>
      <button type="submit" className="btn btn-primary btn-wide" disabled={pending || !hydrated} aria-busy={pending}>
        {pending ? <span className="spinner" aria-hidden="true" /> : null}
        {!hydrated ? "Se încarcă…" : pending ? "Se trimite…" : "Trimite raportul"}
      </button>
      {slow ? (
        <p className="fine" role="status">
          Rețeaua e lentă. Raportul tău e pe drum; nu închide pagina.
        </p>
      ) : null}
    </form>
  );
}

function CityStep({ cities, onPick, onClose }: { cities: CityReport[]; onPick: (index: number) => void; onClose: () => void }) {
  const hydrated = useHydrated();

  return (
    <div className="report-form">
      <div className="sheet-head">
        <h2 id="raport-titlu">În ce oraș?</h2>
        <button type="button" className="x" aria-label="Închide" {...nativeCommand("close")} onClick={onClose}>
          ×
        </button>
      </div>
      <div className="btns">
        {cities.map((option, index) => (
          <button key={option.city.slug} type="button" className="btn btn-wide city-choice" disabled={!hydrated} onClick={() => onPick(index)}>
            {option.city.name}
          </button>
        ))}
      </div>
      <p className="fine">{hydrated ? "Apoi alegi cartierul și ce nu funcționează." : "Se încarcă…"}</p>
    </div>
  );
}

export function ReportDialog({ label, cities }: ReportDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const single = cities.length === 1;
  // Fiecare deschidere pornește de la capăt: formular nou și, pe pagina principală, întrebarea orașului.
  const [round, setRound] = useState(0);
  const [chosen, setChosen] = useState<number | null>(single ? 0 : null);
  const current = chosen === null ? undefined : cities[chosen];

  const close = (): void => dialog.current?.close();

  return (
    <>
      <div className="report-cta">
        <button
          type="button"
          className="btn btn-primary btn-wide"
          {...nativeCommand("show-modal")}
          onClick={() => {
            if (!supportsCommands()) {
              dialog.current?.showModal();
            }
          }}
        >
          <span aria-hidden="true">+</span>
          {label}
        </button>
      </div>
      <dialog
        ref={dialog}
        id={DIALOG_ID}
        className="sheet"
        aria-labelledby="raport-titlu"
        onClose={() => {
          setRound((value) => value + 1);
          setChosen(single ? 0 : null);
        }}
      >
        <div className="grab" aria-hidden="true" />
        {current ? (
          <ReportForm key={`${round}-${current.city.slug}`} props={current} onClose={close} onChangeCity={single ? undefined : () => setChosen(null)} />
        ) : (
          <CityStep cities={cities} onPick={setChosen} onClose={close} />
        )}
      </dialog>
    </>
  );
}
