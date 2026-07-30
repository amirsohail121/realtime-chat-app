// Reusable skeleton components

// Pulsing animation base
const SkeletonBase = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// Chat list item skeleton
export const ChatItemSkeleton = () => (
  <div className="flex items-center gap-3 p-3 mx-2">
    {/* Avatar */}
    <SkeletonBase className="w-10 h-10 rounded-full flex-shrink-0" />
    <div className="flex-1">
      {/* Name */}
      <SkeletonBase className="h-4 w-32 mb-2" />
      {/* Last message */}
      <SkeletonBase className="h-3 w-48" />
    </div>
  </div>
);

// Message bubble skeleton
export const MessageSkeleton = ({ isSender }) => (
  <div className={`flex items-end gap-2 mb-2 ${isSender ? "justify-end" : "justify-start"}`}>
    {!isSender && <SkeletonBase className="w-7 h-7 rounded-full flex-shrink-0" />}
    <div className={`flex flex-col gap-1 ${isSender ? "items-end" : "items-start"}`}>
      <SkeletonBase className={`h-10 rounded-2xl ${isSender ? "w-48" : "w-40"}`} />
      <SkeletonBase className="h-3 w-16" />
    </div>
  </div>
);

// Search result skeleton
export const SearchResultSkeleton = () => (
  <div className="flex items-center gap-3 p-2">
    <SkeletonBase className="w-10 h-10 rounded-full flex-shrink-0" />
    <div className="flex-1">
      <SkeletonBase className="h-4 w-24 mb-1" />
      <SkeletonBase className="h-3 w-36" />
    </div>
  </div>
);

// Profile skeleton
export const ProfileSkeleton = () => (
  <div className="flex flex-col items-center gap-3 p-4">
    <SkeletonBase className="w-20 h-20 rounded-full" />
    <SkeletonBase className="h-5 w-32" />
    <SkeletonBase className="h-4 w-48" />
  </div>
);

// Sidebar skeleton
export const SidebarSkeleton = ({ items = 5 }) => (
  <div className="flex h-full w-80 flex-col border-r border-gray-200 bg-white">
    <div className="border-b border-gray-200 p-4">
      <SkeletonBase className="mb-3 h-6 w-24" />
      <SkeletonBase className="h-10 w-full rounded-xl" />
    </div>

    <div className="flex-1 overflow-y-auto p-2">
      {Array.from({ length: items }).map((_, index) => (
        <ChatItemSkeleton key={index} />
      ))}
    </div>
  </div>
);

// Chat window skeleton
export const ChatWindowSkeleton = ({ messages = 4 }) => (
  <div className="flex h-full flex-col bg-gray-50">
    <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <SkeletonBase className="h-10 w-10 rounded-full" />
        <div>
          <SkeletonBase className="mb-2 h-4 w-24" />
          <SkeletonBase className="h-3 w-16" />
        </div>
      </div>
      <SkeletonBase className="h-8 w-8 rounded-full" />
    </div>

    <div className="flex-1 overflow-y-auto p-4">
      {Array.from({ length: messages }).map((_, index) => (
        <MessageSkeleton key={index} isSender={index % 2 === 0} />
      ))}
    </div>

    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <SkeletonBase className="h-10 flex-1 rounded-xl" />
        <SkeletonBase className="h-10 w-10 rounded-full" />
      </div>
    </div>
  </div>
);