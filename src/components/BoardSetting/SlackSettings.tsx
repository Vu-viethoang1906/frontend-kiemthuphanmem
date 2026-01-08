import React, { useState, useEffect } from "react";
import {
  getBoardSlackConfig,
  updateBoardSlackConfig,
  toggleBoardSlackNotifications,
  testBoardSlackWebhook,
  deleteBoardSlackConfig,
  BoardSlackConfig,
} from "../../api/boardSlackConfigApi";
import toast from "react-hot-toast";

interface SlackSettingsProps {
  boardId: string;
}

const SlackSettings: React.FC<SlackSettingsProps> = ({ boardId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<BoardSlackConfig | null>(null);

  
  const [webhookUrl, setWebhookUrl] = useState("");
  const [channelName, setChannelName] = useState("");
  const [notes, setNotes] = useState("");
  const [notifyTaskCreated, setNotifyTaskCreated] = useState(true);
  const [notifyTaskAssigned, setNotifyTaskAssigned] = useState(true);
  const [notifyTaskCompleted, setNotifyTaskCompleted] = useState(true);
  const [notifyCommentAdded, setNotifyCommentAdded] = useState(true);
  const [isActive, setIsActive] = useState(false);

  
  useEffect(() => {
    loadConfig();
  }, [boardId]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await getBoardSlackConfig(boardId);
      setConfig(data);
      
      
      const webhookUrlValue = data.webhook_url && !data.webhook_url.includes("...") 
        ? data.webhook_url 
        : "";
      setWebhookUrl(webhookUrlValue);
      setChannelName(data.channel_name || "");
      setNotes(data.notes || "");
      setNotifyTaskCreated(data.notify_task_created ?? true);
      setNotifyTaskAssigned(data.notify_task_assigned ?? true);
      setNotifyTaskCompleted(data.notify_task_completed ?? true);
      setNotifyCommentAdded(data.notify_comment_added ?? true);
      setIsActive(data.is_active ?? false);
    } catch (error: any) {
      toast.error(
        <div>
          <div className="font-semibold mb-1">Failed to load Slack configuration!</div>
          <div className="text-sm text-gray-500">
            {error?.response?.data?.message || "Please try again later."}
          </div>
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
   
    if (webhookUrl && !webhookUrl.startsWith("https://hooks.slack.com/services/")) {
      toast.error(
        <div>
          <div className="font-semibold mb-1">Invalid Webhook URL!</div>
          <div className="text-sm text-gray-500">
            Webhook URL must start with https://hooks.slack.com/services/
          </div>
        </div>
      );
      return;
    }

    try {
      setSaving(true);
      const updatedConfig = await updateBoardSlackConfig(boardId, {
        webhook_url: webhookUrl || undefined,
        channel_name: channelName || undefined,
        notes: notes || undefined,
        notify_task_created: notifyTaskCreated,
        notify_task_assigned: notifyTaskAssigned,
        notify_task_completed: notifyTaskCompleted,
        notify_comment_added: notifyCommentAdded,
        is_active: isActive,
      });

      setConfig(updatedConfig);
      toast.success(
        <div>
          <div className="font-semibold mb-1">Updated successfully!</div>
          <div className="text-sm text-gray-500">
            Slack configuration for the board has been saved.
          </div>
        </div>
      );
    } catch (error: any) {
      toast.error(
        <div>
          <div className="font-semibold mb-1">Failed to update configuration!</div>
          <div className="text-sm text-gray-500">
            {error?.response?.data?.message || "Please try again later."}
          </div>
        </div>
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      toast.error(
        <div>
          <div className="font-semibold mb-1">Please enter Webhook URL!</div>
          <div className="text-sm text-gray-500">
            You need to provide the webhook URL before testing.
          </div>
        </div>
      );
      return;
    }

    if (!webhookUrl.startsWith("https://hooks.slack.com/services/")) {
      toast.error(
        <div>
          <div className="font-semibold mb-1">Invalid Webhook URL!</div>
          <div className="text-sm text-gray-500">
            Webhook URL must start with https://hooks.slack.com/services/
          </div>
        </div>
      );
      return;
    }

    try {
      setTesting(true);
      const result = await testBoardSlackWebhook(boardId, webhookUrl);
      
      if (result.success) {
        toast.success(
          <div>
            <div className="font-semibold mb-1">Test successful!</div>
            <div className="text-sm text-gray-500">
              {result.message || "Please check your Slack channel."}
            </div>
          </div>
        );
      } else {
        toast.error(
          <div>
            <div className="font-semibold mb-1">Test failed!</div>
            <div className="text-sm text-gray-500">
              {result.message || "Cannot send notification. Please verify the webhook URL."}
            </div>
          </div>
        );
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message 
        || error?.message 
        || "Cannot send notification. Please verify the webhook URL and ensure it is still active in Slack.";
      
      toast.error(
        <div>
          <div className="font-semibold mb-1">Test failed!</div>
          <div className="text-sm text-gray-500">
            {errorMessage}
          </div>
        </div>
      );
    } finally {
      setTesting(false);
    }
  };

  const handleToggleActive = async (newValue: boolean) => {
    try {
      const result = await toggleBoardSlackNotifications(boardId, newValue);
      setIsActive(result.is_active);
      setConfig((prev) => (prev ? { ...prev, is_active: result.is_active } : null));
      
      toast.success(
        <div>
          <div className="font-semibold mb-1">
            {result.is_active ? "Slack notifications enabled!" : "Slack notifications disabled!"}
          </div>
          <div className="text-sm text-gray-500">
            Slack notifications for this board have been {result.is_active ? "enabled" : "disabled"}.
          </div>
        </div>
      );
    } catch (error: any) {
      toast.error(
        <div>
          <div className="font-semibold mb-1">Unable to update status!</div>
          <div className="text-sm text-gray-500">
            {error?.response?.data?.message || "Please try again later."}
          </div>
        </div>
      );
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete the Slack configuration for this board?")) {
      return;
    }

    try {
      setSaving(true);
      await deleteBoardSlackConfig(boardId);
      
     
      setWebhookUrl("");
      setChannelName("");
      setNotes("");
      setNotifyTaskCreated(true);
      setNotifyTaskAssigned(true);
      setNotifyTaskCompleted(true);
      setNotifyCommentAdded(true);
      setIsActive(false);
      setConfig(null);

      toast.success(
        <div>
          <div className="font-semibold mb-1">Configuration deleted!</div>
          <div className="text-sm text-gray-500">
            The board's Slack configuration has been removed.
          </div>
        </div>
      );
    } catch (error: any) {
      toast.error(
        <div>
          <div className="font-semibold mb-1">Unable to delete configuration!</div>
          <div className="text-sm text-gray-500">
            {error?.response?.data?.message || "Please try again later."}
          </div>
        </div>
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-800">
          <span className="inline-block w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-base font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-800 m-0 mb-2">
          Slack Integration Settings
        </h2>
        <p className="text-sm text-slate-600 m-0">
          Connect the board with Slack to receive notifications about task activities.
        </p>
      </div>

      {}
      <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 m-0 mb-1">
              Enable Slack notifications
            </h3>
            <p className="text-sm text-slate-600 m-0">
              {isActive
                ? "Slack notifications are enabled for this board."
                : "Slack notifications are disabled. Enable to receive updates."}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => handleToggleActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {}
      <div className="mb-6">
        <label className="block mb-2 font-medium text-slate-800 text-sm">
          Webhook URL <span className="text-red-600">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="flex-1 px-3 py-3 border border-slate-300 rounded-none text-base text-slate-800 outline-none focus:border-blue-600 transition-colors"
          />
          <button
            type="button"
            onClick={handleTestWebhook}
            disabled={testing || !webhookUrl}
            className={`px-4 py-3 rounded-md font-semibold text-sm whitespace-nowrap ${
              testing || !webhookUrl
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700 shadow"
            }`}
          >
            {testing ? "Testing..." : "Test"}
          </button>
        </div>
      </div>

      {}
      <div className="mb-6">
        <label className="block mb-2 font-medium text-slate-800 text-sm">
          Channel Name
        </label>
        <input
          type="text"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          className="w-full px-3 py-3 border border-slate-300 rounded-none text-base text-slate-800 outline-none focus:border-blue-600 transition-colors"
        />
      </div>

      {}
      <div className="mb-6">
        <label className="block mb-3 font-medium text-slate-800 text-sm">
          Notification types
        </label>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyTaskCreated}
              onChange={(e) => setNotifyTaskCreated(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">
              Notify when a new task is created
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyTaskAssigned}
              onChange={(e) => setNotifyTaskAssigned(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">
              Notify when a task is assigned to a user
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyTaskCompleted}
              onChange={(e) => setNotifyTaskCompleted(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">
              Notify when a task is completed
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyCommentAdded}
              onChange={(e) => setNotifyCommentAdded(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">
              Notify when a new comment is added
            </span>
          </label>
        </div>
      </div>

      {}
      <div className="mb-8">
        <label className="block mb-2 font-medium text-slate-800 text-sm">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-3 border border-slate-300 rounded-none text-base text-slate-800 outline-none focus:border-blue-600 transition-colors resize-vertical"
        />
      </div>

      {}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`px-5 py-2.5 rounded-md font-semibold text-sm ${
            saving
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow"
          }`}
        >
          {saving ? "Saving..." : "Save configuration"}
        </button>
        {config && (config.webhook_url || webhookUrl) && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className={`px-5 py-2.5 rounded-md font-semibold text-sm ${
              saving
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700 shadow"
            }`}
          >
            Delete configuration
          </button>
        )}
      </div>
    </div>
  );
};

export default SlackSettings;

