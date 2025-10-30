interface GroupCodeDisplayProps {
  groupCode: string;
  onCopy: () => void;
}

export default function GroupCodeDisplay({
  groupCode,
  onCopy,
}: GroupCodeDisplayProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Group Code
      </label>
      <div className="flex items-center space-x-2">
        <code className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg font-mono text-lg">
          {groupCode}
        </code>
        <button
          onClick={onCopy}
          className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
        >
          Copy
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Share this code with others to invite them to your group
      </p>
    </div>
  );
}
