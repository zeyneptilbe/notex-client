import { useState } from "react";
import { Modal } from "../common/Modal";
import { MarkdownViewer } from "../common";
import type { Post } from "../../api/posts.api";
import type { PostRevision, RevisionAttachment } from "../../api/posts.api";

interface RevisionCompareProps {
  currentPost: Post;
  revisions: PostRevision[];
  onClose: () => void;
}

const visibilityLabels: Record<number, string> = {
  0: "Takım",
  1: "Birim",
  2: "Şirket",
  3: "Grup Müdürlüğü",
  4: "Direktörlük",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon(contentType: string): string {
  if (contentType.startsWith("image/")) return "🖼️";
  if (contentType === "application/pdf") return "📕";
  if (contentType.includes("spreadsheet") || contentType.includes("excel") || contentType === "text/csv") return "📊";
  if (contentType.includes("document") || contentType.includes("word") || contentType.includes("msword")) return "📝";
  if (contentType.includes("presentation") || contentType.includes("powerpoint")) return "📙";
  if (contentType.includes("zip") || contentType.includes("compressed")) return "📦";
  if (contentType.startsWith("video/")) return "🎬";
  if (contentType.startsWith("audio/")) return "🎵";
  return "📄";
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, i) => val === sortedB[i]);
}

function attachmentsEqual(
  a: Array<{ originalFileName: string; fileSize: number }>,
  b: RevisionAttachment[],
): boolean {
  if (a.length !== b.length) return false;
  const keyA = a.map((x) => `${x.originalFileName}:${x.fileSize}`).sort();
  const keyB = b.map((x) => `${x.originalFileName}:${x.fileSize}`).sort();
  return keyA.every((val, i) => val === keyB[i]);
}

export function RevisionCompare({
  currentPost,
  revisions,
  onClose,
}: RevisionCompareProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"current" | "previous">("current");

  const revision = revisions[selectedIndex];

  const titleChanged = currentPost.title !== revision.title;
  const summaryChanged = (currentPost.summary || "") !== (revision.summary || "");
  const contentChanged = (currentPost.content || "") !== revision.content;
  const categoryChanged = (currentPost.categoryId || null) !== revision.categoryId;
  const tagsChanged = !arraysEqual(currentPost.tags || [], revision.tags || []);
  const visibilityChanged = currentPost.visibility !== revision.visibility;
  const attachmentsChanged = !attachmentsEqual(
    currentPost.attachments || [],
    revision.attachments || [],
  );

  const changes = [
    titleChanged && "Başlık",
    summaryChanged && "Özet",
    contentChanged && "İçerik",
    categoryChanged && "Kategori",
    tagsChanged && "Etiketler",
    visibilityChanged && "Görünürlük",
    attachmentsChanged && "Dosyalar",
  ].filter(Boolean);

  const ChangeBadge = () => (
    <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
      değişti
    </span>
  );

  const renderAttachments = (
    attachments: Array<{ originalFileName: string; fileSize: number; contentType: string }>,
  ) => {
    if (attachments.length === 0) {
      return <p className="text-gray-400 text-sm italic">Dosya yok</p>;
    }
    return (
      <ul className="space-y-1.5">
        {attachments.map((att, i) => (
          <li
            key={i}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm"
          >
            <span className="shrink-0">{getFileIcon(att.contentType)}</span>
            <span className="truncate">{att.originalFileName}</span>
            <span className="shrink-0 text-gray-400">
              ({formatFileSize(att.fileSize)})
            </span>
          </li>
        ))}
      </ul>
    );
  };

  const renderTags = (tags: string[]) => {
    if (tags.length === 0) {
      return <span className="text-gray-400 italic text-sm">Etiket yok</span>;
    }
    return (
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-md"
          >
            #{tag}
          </span>
        ))}
      </div>
    );
  };

  const renderVersion = (
    data: {
      title: string;
      summary: string;
      content: string;
      categoryName: string | null | undefined;
      visibility: number;
      tags: string[];
      attachments: Array<{ originalFileName: string; fileSize: number; contentType: string }>;
    },
    showMeta?: boolean,
  ) => (
    <div className="space-y-4">
      {/* Başlık */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
          Başlık {titleChanged && <ChangeBadge />}
        </h4>
        <p className="text-lg font-bold text-gray-800">{data.title}</p>
      </div>

      {/* Meta: Kategori, Görünürlük */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
            Kategori {categoryChanged && <ChangeBadge />}
          </h4>
          <p className="text-sm text-gray-700">
            {data.categoryName || "Belirtilmemiş"}
          </p>
        </div>
        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
            Görünürlük {visibilityChanged && <ChangeBadge />}
          </h4>
          <p className="text-sm text-gray-700">
            {visibilityLabels[data.visibility] || "Bilinmiyor"}
          </p>
        </div>
      </div>

      {/* Etiketler */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
          Etiketler {tagsChanged && <ChangeBadge />}
        </h4>
        {renderTags(data.tags)}
      </div>

      {/* Özet */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
          Özet {summaryChanged && <ChangeBadge />}
        </h4>
        <p className="text-gray-700 italic">{data.summary || "—"}</p>
      </div>

      {/* İçerik */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
          İçerik {contentChanged && <ChangeBadge />}
        </h4>
        <div className="prose prose-sm max-w-none mt-2 p-4 bg-white border border-gray-200 rounded-lg">
          <MarkdownViewer content={data.content || ""} />
        </div>
      </div>

      {/* Dosyalar */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
          Ekli Dosyalar ({data.attachments.length}) {attachmentsChanged && <ChangeBadge />}
        </h4>
        {renderAttachments(data.attachments)}
      </div>

      {/* Revizyon Bilgisi (sadece önceki tab) */}
      {showMeta && (
        <div className="pt-3 border-t border-gray-200 text-xs text-gray-500">
          Düzenleyen: {revision.editedByName} -{" "}
          {new Date(revision.createdAt).toLocaleDateString("tr-TR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}
    </div>
  );

  return (
    <Modal isOpen onClose={onClose} title="Revizyon Karşılaştırma" size="2xl">
      <div>
        {/* Revizyon Seçici (birden fazla varsa) */}
        {revisions.length > 1 && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">
              Revizyon Seç
            </label>
            <select
              value={selectedIndex}
              onChange={(e) => {
                setSelectedIndex(Number(e.target.value));
                setActiveTab("current");
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {revisions.map((rev, i) => (
                <option key={rev.id} value={i}>
                  Rev. {rev.revisionNumber} - {rev.editedByName} ({new Date(rev.createdAt).toLocaleDateString("tr-TR")})
                  {rev.changeNote ? ` — ${rev.changeNote}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* changeNote Bilgisi */}
        {revision.changeNote && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <span className="text-blue-500 shrink-0">i</span>
            <p className="text-sm text-blue-700">{revision.changeNote}</p>
          </div>
        )}

        {/* Tab Header */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "current"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("current")}
          >
            Güncel Versiyon
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "previous"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("previous")}
          >
            Önceki Versiyon (Rev. {revision.revisionNumber})
          </button>
        </div>

        {/* Değişiklik Özeti */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
          <span className="font-medium">Değişen alanlar: </span>
          {changes.length === 0 ? (
            <span>Hiçbir alan değişmemiş</span>
          ) : (
            <span>{changes.join(", ")}</span>
          )}
        </div>

        {/* Tab Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {activeTab === "current"
            ? renderVersion({
                title: currentPost.title,
                summary: currentPost.summary || "",
                content: currentPost.content || "",
                categoryName: currentPost.categoryName,
                visibility: currentPost.visibility,
                tags: currentPost.tags || [],
                attachments: currentPost.attachments || [],
              })
            : renderVersion(
                {
                  title: revision.title,
                  summary: revision.summary || "",
                  content: revision.content,
                  categoryName: revision.categoryName,
                  visibility: revision.visibility,
                  tags: revision.tags || [],
                  attachments: revision.attachments || [],
                },
                true,
              )}
        </div>
      </div>
    </Modal>
  );
}
