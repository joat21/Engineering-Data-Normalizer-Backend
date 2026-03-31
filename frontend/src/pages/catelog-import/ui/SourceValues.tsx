interface SourceValuesProps {
  title: string;
  values: (string | number)[];
}

export const SourceValues = ({ title, values }: SourceValuesProps) => {
  return (
    <div className="flex flex-col gap-2 mb-2">
      <span className="font-medium">{title}:</span>
      {values.map((value, i) => (
        <div
          key={i}
          className="px-3 py-2 border rounded-xl font-mono shadow-inner/5"
        >
          {value}
        </div>
      ))}
    </div>
  );
};
