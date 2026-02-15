import MDEditor from "@uiw/react-md-editor";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
  error?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Markdown formatında yazın...",
  height = 400,
  disabled = false,
  error,
}: MarkdownEditorProps) {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || "")}
        preview="edit"
        height={height}
        textareaProps={{
          placeholder,
          disabled,
        }}
        className={error ? "border-red-500" : ""}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
