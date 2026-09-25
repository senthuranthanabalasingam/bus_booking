"use client";

export type SeatState = "available" | "selected" | "booked" | "mine";

const seatStyles: Record<SeatState, string> = {
  available: "border-slate-300 bg-white text-slate-700 hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer",
  selected: "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/30 cursor-pointer",
  booked: "border-slate-200 bg-slate-200 text-slate-400 cursor-not-allowed",
  mine: "border-emerald-500 bg-emerald-100 text-emerald-700 cursor-not-allowed",
};

export function SeatMap({
  totalSeats,
  seatsPerRow,
  stateOf,
  onToggle,
}: {
  totalSeats: number;
  seatsPerRow: number;
  stateOf: (seat: number) => SeatState;
  onToggle: (seat: number) => void;
}) {
  const leftCount = Math.ceil(seatsPerRow / 2);
  const rows = Array.from({ length: Math.ceil(totalSeats / seatsPerRow) }, (_, r) =>
    Array.from({ length: seatsPerRow }, (_, i) => r * seatsPerRow + i + 1),
  );

  const renderSeat = (seat: number) => {
    if (seat > totalSeats) return <div key={seat} className="h-11 w-11" />;
    const state = stateOf(seat);
    const disabled = state === "booked" || state === "mine";
    return (
      <button
        key={seat}
        type="button"
        disabled={disabled}
        onClick={() => onToggle(seat)}
        aria-pressed={state === "selected"}
        aria-label={`Seat ${seat}, ${state === "mine" ? "booked by you" : state}`}
        className={`relative h-11 w-11 rounded-t-xl rounded-b-md border-2 text-xs font-semibold transition ${seatStyles[state]}`}
      >
        {seat}
      </button>
    );
  };

  return (
    <div className="mx-auto w-fit rounded-[2.5rem] border-4 border-slate-300 bg-slate-50 px-5 pb-6 pt-4">
      {/* Front of the bus */}
      <div className="mb-5 flex items-center justify-between border-b-2 border-dashed border-slate-300 pb-3">
        <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">Front</span>
        <span className="grid h-9 w-9 place-items-center rounded-full border-4 border-slate-400 text-[10px] text-slate-500" title="Driver">
          ●
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {rows.map((row, r) => (
          <div key={r} className="flex items-center gap-2">
            {row.slice(0, leftCount).map(renderSeat)}
            <div className="w-8" aria-hidden />
            {row.slice(leftCount).map(renderSeat)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SeatLegend() {
  const items: [SeatState, string][] = [
    ["available", "Available"],
    ["selected", "Selected"],
    ["mine", "Your booking"],
    ["booked", "Taken"],
  ];
  return (
    <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-600">
      {items.map(([state, label]) => (
        <span key={state} className="flex items-center gap-1.5">
          <span className={`h-4 w-4 rounded border-2 ${seatStyles[state].replace(/cursor-\S+|hover:\S+/g, "")}`} />
          {label}
        </span>
      ))}
    </div>
  );
}
