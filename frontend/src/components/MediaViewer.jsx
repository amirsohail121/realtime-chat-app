import { useState } from "react";
import { FiX, FiDownload } from "react-icons/fi";

const MediaViewer = ({ url, type, fileName, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-screen w-full p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-80 z-10"
        >
          <FiX size={20} />
        </button>

        {/* Download button */}
<a
        href={url}
        download={fileName}
        className="absolute top-2 left-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-80 z-10 flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
        >
        <FiDownload size={20} />
      </a>

      {/* Image viewer */}
      {type === "image" && (
        <img
          src={url}
          alt={fileName}
          className="max-w-full max-h-screen object-contain mx-auto rounded-lg"
        />
      )}

      {/* Video player */}
      {type === "video" && (
        <video
          src={url}
          controls
          autoPlay
          className="max-w-full max-h-screen mx-auto rounded-lg"
        />
      )}

      {/* File download */}
      {type === "file" && (
        <div className="bg-white rounded-lg p-8 text-center max-w-sm mx-auto">
          <div className="text-6xl mb-4">📄</div>
          <p className="text-gray-800 font-medium mb-2">{fileName}</p>
<a
          href={url}
          download={fileName}
          className="inline-block bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600"
            >
          Download File
        </a>
          </div>
  )
}
      </div >
    </div >
  );
};

export default MediaViewer;