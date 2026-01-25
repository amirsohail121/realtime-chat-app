import { useContext } from "react";
import { ChatContext } from "../context/ChatContext";
import { BsFillChatTextFill } from "react-icons/bs";
import { HiUserGroup } from "react-icons/hi2";

const Sidebar = () => {
  const { chatList, setSelectedChat } = useContext(ChatContext);

  return (
    <div className="flex flex-row h-screen">
      <div className="basis-1/3 px-6 py-6 flex flex-col gap-6 bg-gray-50">
        <BsFillChatTextFill className="text-green-500 text-3xl cursor-pointer hover:text-green-600" />
        <HiUserGroup className="text-green-500 text-3xl cursor-pointer hover:text-green-600" />
      </div>
      <div className="basis-2/3 flex flex-col">
        <div className="bg-[#372aac] text-white">
          <h2 className="text-3xl py-3 font-semibold px-3">Chat</h2>
        </div>
        <input type="text" className="w-100 my-5 p-2  mx-3 border rounded mb-4" placeholder="Search chats..." />
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {chatList.length > 0 ? (
            chatList.map((chat, index) => (
              <div
                key={index}
                onClick={() => setSelectedChat(chat)}
                className="p-4 cursor-pointer"
              >
                {chat}
              </div>
            ))
          ) : (
            <p className="p-4 text-gray-400">No chats yet</p>
          )}
        </div>
      </div>
    </div>

  );
};

export default Sidebar;