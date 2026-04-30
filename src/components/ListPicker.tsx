import type { ListEntry } from "../lib/types";

interface Props {
  lists: ListEntry[];
  selected: string;
  onChange: (slug: string) => void;
}

export default function ListPicker({ lists, selected, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {lists.map((l) => {
        const active = l.slug === selected;
        return (
          <button
            key={l.slug}
            onClick={() => onChange(l.slug)}
            className={
              "px-4 py-2 rounded-full text-sm font-semibold transition border " +
              (active
                ? "bg-sun-500 text-white border-sun-500 shadow-pop"
                : "bg-white/70 text-sun-800 border-sun-200 hover:bg-sun-100")
            }
          >
            {l.name}
            <span className={"ml-2 text-xs " + (active ? "text-white/80" : "text-sun-600/70")}>
              {l.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
