import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { FiUser, FiBell, FiMoon, FiLogOut, FiSun } from "react-icons/fi";

export default function SettingsPage() {
  const { logout } = useContext(AuthContext);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const SettingCard = ({ icon, title, description, action }) => (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6 mb-4 hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`text-2xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {icon}
          </div>
          <div>
            <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              {description}
            </p>
          </div>
        </div>
        {action}
      </div>
    </div>
  );

  const Toggle = ({ isActive, onChange }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        isActive ? 'bg-blue-600' : 'bg-gray-300'
      }`}
      role="switch"
      aria-checked={isActive}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
          isActive ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} py-12 px-4 transition-colors duration-300`}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Settings
          </h1>
          <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your account preferences
          </p>
        </div>

        <SettingCard
          icon={<FiUser size={24} />}
          title="Profile"
          description="Update your personal information"
          action={
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Edit
            </button>
          }
        />

        <SettingCard
          icon={<FiBell size={24} />}
          title="Notifications"
          description="Manage your notification preferences"
          action={<Toggle isActive={notifications} onChange={() => setNotifications(!notifications)} />}
        />

        <SettingCard
          icon={darkMode ? <FiSun size={24} /> : <FiMoon size={24} />}
          title="Appearance"
          description="Toggle between light and dark theme"
          action={<Toggle isActive={darkMode} onChange={() => setDarkMode(!darkMode)} />}
        />

        <button
          onClick={logout}
          className="w-full mt-8 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-md font-medium transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <FiLogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}