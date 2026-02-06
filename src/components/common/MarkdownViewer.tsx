import MDEditor from "@uiw/react-md-editor";

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div data-color-mode="light" className="markdown-body">
      <MDEditor.Markdown source={content} />
    </div>
  );
}
