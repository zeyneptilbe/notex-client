import type { PostAttachment } from "../../api/posts.api";
import { attachmentsApi } from "../../api/posts.api";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon(contentType: string): string {
  if (contentType.startsWith("image/")) return "🖼️";
  if (contentType === "application/pdf") return "📕";
  if (
    contentType.includes("spreadsheet") ||
    contentType.includes("excel") ||
    contentType === "text/csv"
  )
    return "📊";
  if (
    contentType.includes("document") ||
    contentType.includes("word") ||
    contentType.includes("msword")
  )
    return "📝";
  if (
    contentType.includes("presentation") ||
    contentType.includes("powerpoint")
  )
    return "📙";
  if (contentType.includes("zip") || contentType.includes("compressed"))
    return "📦";
  if (contentType.startsWith("video/")) return "🎬";
  if (contentType.startsWith("audio/")) return "🎵";
  return "📄";
}

interface AttachmentListProps {
  attachments: PostAttachment[];
  onDelete?: (id: string) => void;
  deleting?: string | null;
}

export function AttachmentList({
  attachments,
  onDelete,
  deleting,
}: AttachmentListProps) {
  if (attachments.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">
        Ekli Dosyalar ({attachments.length})
      </h3>
      <ul className="space-y-2">
        {attachments.map((att) => (
          <li
            key={att.id}
            className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="shrink-0 text-lg">
                {getFileIcon(att.contentType)}
              </span>
              <span className="truncate">{att.originalFileName}</span>
              <span className="shrink-0 text-gray-400">
                ({formatFileSize(att.fileSize)})
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-2">
              <button
                type="button"
                onClick={() => attachmentsApi.download(att.id)}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
              >
                İndir
              </button>

              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(att.id)}
                  disabled={deleting === att.id}
                  className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                >
                  {deleting === att.id ? "Siliniyor..." : "Sil"}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
