




import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useModal } from "../../components/ModalProvider";
import {
  fetchAllApiKey,
  createApiKey,
  deleteApiKey,
  updateApiKey,
  ApiKey,
} from "../../api/apiKey";

const ApiKeyManagement: React.FC = () => {
  const modal = useModal();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    key: "",
    revoked: false,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNewKey, setShowNewKey] = useState<{
    key: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching API keys...");
      const response = await fetchAllApiKey();
      console.log("API Response:", response);

      if (response && Array.isArray(response.data)) {
        const formattedKeys = response.data.map((key: ApiKey) => ({
          _id: key._id,
          key: key.key,
          description: key.description || "No description",
          revoked: key.revoked || false,
          createdAt: key.createdAt,
          updatedAt: key.updatedAt || key.createdAt,
        }));

        console.log("Formatted API keys:", formattedKeys);
        setApiKeys(formattedKeys);
      } else {
        console.error("Unexpected API response format:", response);
        toast.error("Failed to load API keys: Invalid data format");
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
      toast.error("Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const startEditing = (key: ApiKey) => {
    setEditingKey(key);
    setFormData({
      description: key.description,
      key: key.key,
      revoked: key.revoked || false,
    });
    setIsEditing(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKey) return;

    try {
      const updatedKey = await updateApiKey(editingKey._id, {
        description: formData.description,
        revoked: formData.revoked,
      });

      setApiKeys((prevKeys) =>
        prevKeys.map((k) =>
          k._id === editingKey._id ? { ...k, ...updatedKey } : k
        )
      );

      toast.success(
        <div>
          <div className="font-semibold mb-1">API key updated successfully!</div>
          <div className="text-sm text-gray-500">The API key has been updated.</div>
        </div>
      );

      setIsEditing(false);
      fetchApiKeys();
      setEditingKey(null);
    } catch (error) {
      console.error("Error updating API key:", error);
      toast.error("Unable to update API key. Please try again!");
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingKey(null);
    setFormData({ description: "", key: "", revoked: false });
  };

  const generateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim() || !formData.key.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsGenerating(true);
      const response = await createApiKey({
        description: formData.description,
        key: formData.key,
      });

      if (response.data) {
        toast.success(
          <div>
            <div className="font-semibold mb-1">API key created successfully!</div>
            <div className="text-sm text-gray-500">The API key has been created and is ready to use.</div>
          </div>
        );
        setFormData({ description: "", key: "", revoked: false });
        fetchApiKeys();
        setShowCreateModal(false);
      } else {
        throw new Error("No data received from server");
      }
    } catch (error) {
      console.error("Error generating API key:", error);
      toast.error("Unable to create API key. Please try again!");
    } finally {
      setIsGenerating(false);
    }
  };

  const revokeApiKey = async (id: string) => {
    const confirmed = await modal.confirm({
      title: "Revoke API Key",
      message: "Are you sure you want to revoke this API key?\nThis action cannot be undone!",
      variant: "error"
    });
    
    if (!confirmed) return;

    try {
      await deleteApiKey(id);
      toast.success(
        <div>
          <div className="font-semibold mb-1">API key revoked successfully!</div>
          <div className="text-sm text-gray-500">The API key has been revoked and can no longer be used.</div>
        </div>
      );
      fetchApiKeys();
    } catch (error) {
      console.error("Error revoking API key:", error);
      toast.error("Failed to revoke API key. Please try again!");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* New API Key Form */}
      <button
        type="button"
        onClick={() => setShowCreateModal(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Create New API Key
      </button>
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Create API Key
            </h3>
            <form onSubmit={generateApiKey}>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., Google Calendar Integration"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Key</label>
                <input
                  type="text"
                  name="key"
                  value={formData.key}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter key or leave blank for auto-generation"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Key Modal */}
      {isEditing && editingKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit API Key
            </h3>
            <form onSubmit={saveEdit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  name="revoked"
                  id="revoked"
                  checked={formData.revoked}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="revoked"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Revoked
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Key Modal */}
      {showNewKey && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              New API Key Created
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Please copy your new API key. You won't be able to see it again.
            </p>

            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <div className="flex justify-between items-center">
                <span className="font-mono text-sm break-all">
                  {showNewKey.key}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(showNewKey.key)}
                  className="ml-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowNewKey(null)}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                I've copied the key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Your API Keys</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your API keys for external integrations
          </p>
        </div>

        {apiKeys.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <p>
              No API keys found. Generate your first API key to get started.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {apiKeys.map((apiKey) => (
              <li key={apiKey._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">
                        {apiKey.description || "No description"}
                      </span>
                      {!apiKey.revoked ? (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Revoked
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded break-all">
                        {apiKey.key}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(apiKey.key)}
                        className="ml-2 text-blue-600 hover:text-blue-800 text-xs font-medium whitespace-nowrap"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      Created: {formatDate(apiKey.createdAt)} • Updated:{" "}
                      {formatDate(apiKey.updatedAt)}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      type="button"
                      onClick={() => startEditing(apiKey)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Edit
                    </button>
                    {!apiKey.revoked && (
                      <button
                        type="button"
                        onClick={() => revokeApiKey(apiKey._id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Documentation Link */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Need help with API keys?
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Check out our{" "}
                <a
                  href="/docs/api"
                  className="font-medium underline hover:text-blue-600"
                >
                  API documentation
                </a>{" "}
                to learn how to use your API keys.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManagement;
