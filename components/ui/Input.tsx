type InputProps = {
  label: string;
  placeholder?: string;
  type?: string;
};

export default function Input({
  label,
  placeholder,
  type = "text",
}: InputProps) {
  return (
    <div>
      <label className="block mb-2 font-medium">
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}