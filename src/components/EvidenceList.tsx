export interface EvidenceItem {
  id: string;
  fileName: string;
  filePath: string;
}

export default function EvidenceList({ evidence }: { evidence: EvidenceItem[] }) {
  if (evidence.length === 0) {
    return <span className="text-xs text-slate-400">No files</span>;
  }
  return (
    <ul className="space-y-1">
      {evidence.map((e) => (
        <li key={e.id}>
          <a
            href={`/api/files/${encodeURIComponent(e.filePath)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-700 underline hover:text-blue-900"
          >
            {e.fileName}
          </a>
        </li>
      ))}
    </ul>
  );
}
