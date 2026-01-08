import React, { useEffect, useRef, useState, useContext } from 'react';
import { Check } from 'lucide-react';
import {
  BasicSidebarConfig,
  BasicSidebarKey,
  getBasicSidebarConfig,
  updateBasicSidebarItem,
  uploadBasicSidebarIcon,
} from '../../api/sidebarApi';
import toast from 'react-hot-toast';
import { t } from 'msw/lib/glossary-de6278a9';
const BASIC_KEYS: BasicSidebarKey[] = [
  'introduction',
  'dashboard',
  'projects',
  'reports',
  'groups',
  'profile',
  'settings',
  'usermanagement',
  'roleandpermission',
  'permissionmanagement',
  'templates',
  'centers',
  'userpoints',
];

const API_BASE_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3005/api';
const MAX_ICON_SIZE = 5 * 1024 * 1024; // 5MB

// Helper function to convert icon URL to full URL
const getIconUrl = (iconUrl: string | null | undefined): string | null => {
  if (!iconUrl) return null;

  // If it's already a full URL, return as is
  if (iconUrl.startsWith('http')) {
    return iconUrl;
  }

  // Convert relative path to full URL
  const baseUrl = process.env.REACT_APP_SOCKET_URL
    ? process.env.REACT_APP_SOCKET_URL.replace('/api', '')
    : 'http://localhost:3005';

  // Handle both /api/uploads and /uploads paths
  if (iconUrl.startsWith('/api/uploads')) {
    return `${baseUrl}${iconUrl}`;
  } else if (iconUrl.startsWith('/uploads')) {
    return `${baseUrl}/api${iconUrl}`;
  } else {
    // Relative path, assume it needs /api/uploads prefix
    const cleanPath = iconUrl.startsWith('/') ? iconUrl : `/${iconUrl}`;
    return `${baseUrl}/api/uploads${cleanPath}`;
  }
};

const buildSidebarRecord = <T,>(factory: () => T): Record<BasicSidebarKey, T> => ({
  introduction: factory(),
  dashboard: factory(),
  projects: factory(),
  reports: factory(),
  groups: factory(),
  profile: factory(),
  settings: factory(),
  usermanagement: factory(),
  roleandpermission: factory(),
  permissionmanagement: factory(),
  templates: factory(),
  centers: factory(),
  userpoints: factory(),
});

type RowFormState = {
  name: string;
  icon: string;
};

type PreviewState = {
  name: string;
  iconUrl: string | null;
};

const createInitialFormState = (): Record<BasicSidebarKey, RowFormState> =>
  buildSidebarRecord(() => ({ name: '', icon: '' }));

const createInitialPreviewState = (): Record<BasicSidebarKey, PreviewState> =>
  buildSidebarRecord(() => ({ name: '', iconUrl: null }));

const createInitialPreviewIconState = (): Record<BasicSidebarKey, string | null> =>
  buildSidebarRecord(() => null);

const SidebarManagementSettings: React.FC = () => {
  const [items, setItems] = useState<BasicSidebarConfig[]>([]);
  const [formState, setFormState] =
    useState<Record<BasicSidebarKey, RowFormState>>(createInitialFormState());
  const [previewState, setPreviewState] = useState<Record<BasicSidebarKey, PreviewState>>(
    createInitialPreviewState(),
  );
  const [tempIconPreview, setTempIconPreview] = useState<Record<BasicSidebarKey, string | null>>(
    createInitialPreviewIconState(),
  );
  const [tempIconFiles, setTempIconFiles] = useState<Record<BasicSidebarKey, File | null>>(
    buildSidebarRecord(() => null),
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [savingPreviewKey, setSavingPreviewKey] = useState<BasicSidebarKey | null>(null);
  const [uploadingKey, setUploadingKey] = useState<BasicSidebarKey | null>(null);
  const [savingAll, setSavingAll] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const previewStoreRef = useRef<Record<BasicSidebarKey, string | null>>(
    createInitialPreviewIconState(),
  );

  const revokePreviewUrl = (url: string | null) => {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  };

  const setPreviewForKey = (key: BasicSidebarKey, url: string | null) => {
    revokePreviewUrl(previewStoreRef.current[key]);
    previewStoreRef.current[key] = url;
    setTempIconPreview((prev) => ({
      ...prev,
      [key]: url,
    }));
  };

  const clearAllPreviews = () => {
    for (const key of BASIC_KEYS) {
      revokePreviewUrl(previewStoreRef.current[key]);
      previewStoreRef.current[key] = null;
    }
    setTempIconPreview(createInitialPreviewIconState());
  };

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const basicConfig = await getBasicSidebarConfig();

      const nextFormState = createInitialFormState();
      const nextPreviewState = createInitialPreviewState();

      for (const item of basicConfig) {
        nextFormState[item.key] = {
          name: item.name,
          icon: item.icon,
        };
        nextPreviewState[item.key] = {
          name: item.name,
          iconUrl: item.iconUrl || null,
        };
      }

      const sortedConfig = BASIC_KEYS.map((key) =>
        basicConfig.find((item) => item.key === key),
      ).filter(Boolean) as BasicSidebarConfig[];

      clearAllPreviews();
      setItems(sortedConfig);
      setFormState(nextFormState);
      setPreviewState(nextPreviewState);
    } catch (err: any) {
      setError(err?.message || 'Failed to load sidebar list. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      clearAllPreviews();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (key: BasicSidebarKey, field: keyof RowFormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  // Update preview with name only (when clicking checkmark)
  const handleUpdatePreviewName = (item: BasicSidebarConfig) => {
    const current = formState[item.key];
    const trimmedName = current?.name?.trim() ?? '';

    if (!trimmedName) {
      toast.error('Name cannot be empty.');
      return;
    }

    // Get icon URL from temp preview or current item
    let iconUrl: string | null = null;

    if (tempIconPreview[item.key]) {
      // Use temp preview (blob URL) for preview - keep it as blob URL
      iconUrl = tempIconPreview[item.key];
    } else if (item.iconUrl) {
      // Use existing icon URL - convert to full URL
      iconUrl = getIconUrl(item.iconUrl);
    }

    // Update preview state
    setPreviewState((prev) => ({
      ...prev,
      [item.key]: {
        name: trimmedName,
        iconUrl: iconUrl,
      },
    }));
  };

  // Update preview when clicking "lưu" button
  const handleUpdatePreview = async (item: BasicSidebarConfig) => {
    const current = formState[item.key];
    const trimmedName = current?.name?.trim() ?? '';

    if (!trimmedName) {
      toast.error('error');
      return;
    }

    setSavingPreviewKey(item.key);

    // Get icon URL from temp preview or current item
    let iconUrl: string | null = null;

    if (tempIconPreview[item.key]) {
      // Use temp preview (blob URL) for preview - keep it as blob URL
      iconUrl = tempIconPreview[item.key];
    } else if (item.iconUrl) {
      // Use existing icon URL - convert to full URL
      iconUrl = getIconUrl(item.iconUrl);
    }

    // Update preview state
    setPreviewState((prev) => ({
      ...prev,
      [item.key]: {
        name: trimmedName,
        iconUrl: iconUrl,
      },
    }));

    setSavingPreviewKey(null);
  };

  // Handle upload and update preview
  const handleUploadAndUpdatePreview = async (item: BasicSidebarConfig) => {
    const current = formState[item.key];
    const trimmedName = current?.name?.trim() ?? '';

    if (!trimmedName) {
      toast.error('Name cannot be empty.');
      return;
    }

    setSavingPreviewKey(item.key);
    setError(null);

    try {
      let iconUrl: string | null = null;

      // If there's a new icon file, upload it first
      if (tempIconFiles[item.key]) {
        setUploadingKey(item.key);
        try {
          const uploadedItem = await uploadBasicSidebarIcon(item.key, tempIconFiles[item.key]!);
          iconUrl = getIconUrl(uploadedItem.iconUrl);

          // Clear temp file after successful upload
          setTempIconFiles((prev) => ({
            ...prev,
            [item.key]: null,
          }));

          // Update items with new icon
          setItems((prev) =>
            prev.map((existing) =>
              existing.key === item.key ? { ...existing, ...uploadedItem } : existing,
            ),
          );
        } catch (err: any) {
          console.error(`Failed to upload icon for ${item.key}:`, err);
          setUploadingKey(null);
          setSavingPreviewKey(null);
          toast.error('error');
          return;
        } finally {
          setUploadingKey(null);
        }
      } else {
        // Use existing icon URL
        iconUrl = getIconUrl(item.iconUrl);
      }

      // Update preview state with name and icon
      setPreviewState((prev) => ({
        ...prev,
        [item.key]: {
          name: trimmedName,
          iconUrl: iconUrl,
        },
      }));

      // Clear temp preview after updating
      if (tempIconPreview[item.key]) {
        setPreviewForKey(item.key, null);
      }
    } catch (err: any) {
      setError(err?.message || 'Error updating preview. Please try again.');
    } finally {
      setSavingPreviewKey(null);
    }
  };

  // Handle icon file selection
  const handleIconFileChange = (item: BasicSidebarConfig, file?: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files (PNG/JPG/SVG) are accepted.');
      return;
    }

    if (file.size > MAX_ICON_SIZE) {
      toast.error('Image too large (maximum 5MB).');
      return;
    }

    // Store the file for upload
    setTempIconFiles((prev) => ({
      ...prev,
      [item.key]: file,
    }));

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setPreviewForKey(item.key, previewUrl);
  };

  // Save all changes to real sidebar
  const handleSaveAll = async () => {
    setSavingAll(true);
    setError(null);

    try {
      // Save all items that have changes
      for (const item of items) {
        const preview = previewState[item.key];
        const original = items.find((i) => i.key === item.key);

        if (!original) continue;

        const nameChanged = preview.name !== original.name;
        const hasNewIcon = tempIconFiles[item.key] !== null;

        if (!nameChanged && !hasNewIcon) continue;

        // If there's a new icon file, upload it first
        if (hasNewIcon && tempIconFiles[item.key]) {
          setUploadingKey(item.key);
          try {
            await uploadBasicSidebarIcon(item.key, tempIconFiles[item.key]!);
            // Clear temp file after successful upload
            setTempIconFiles((prev) => ({
              ...prev,
              [item.key]: null,
            }));
            // Clear preview URL
            setPreviewForKey(item.key, null);
          } catch (err: any) {
            console.error(`Failed to upload icon for ${item.key}:`, err);
            throw err;
          } finally {
            setUploadingKey(null);
          }
        }

        // Update name if changed
        if (nameChanged) {
          await updateBasicSidebarItem(item.key, { name: preview.name });
        }
      }

      // Reload items to get updated data
      await loadItems();
      toast.success('All changes saved successfully!');
    } catch (err: any) {
      setError(err?.message || 'Error saving. Please try again.');
    } finally {
      setSavingAll(false);
    }
  };

  // Get icon path for preview
  const getPreviewIconPath = (item: BasicSidebarConfig): string => {
    const preview = previewState[item.key];

    // Priority: preview iconUrl (which includes temp preview blob URLs) > original iconUrl > default icon
    if (preview.iconUrl) {
      // If it's a blob URL or full URL, use it directly
      if (preview.iconUrl.startsWith('blob:') || preview.iconUrl.startsWith('http')) {
        return preview.iconUrl;
      }
      // Otherwise, it's a relative path - convert to full URL
      const fullUrl = getIconUrl(preview.iconUrl);
      if (fullUrl) return fullUrl;
    }

    // Fallback to original icon
    const originalIconUrl = getIconUrl(item.iconUrl);
    if (originalIconUrl) {
      return originalIconUrl;
    }

    return `/icons/icon-${item.defaultIcon || item.icon || 'dashboard'}.png`;
  };

  // Render sidebar preview
  const renderSidebarPreview = () => {
    const grouped = items.reduce(
      (acc, item) => {
        const menuType = item.menuType || 'main';
        if (!acc[menuType]) {
          acc[menuType] = [];
        }
        acc[menuType].push(item);
        return acc;
      },
      {} as Record<string, BasicSidebarConfig[]>,
    );

    const menuOrder: ('main' | 'personal' | 'admin')[] = ['main', 'personal', 'admin'];

    return (
      <div className="flex flex-col h-full w-full">
        <div className="flex items-center justify-between px-3 py-3 flex-shrink-0">
          <img src="/icons/CodeGym.png" alt="Logo" className="h-10 w-auto object-contain" />
        </div>

        <nav className="flex-1 py-2 px-3 overflow-y-auto min-h-0">
          {menuOrder.map((menuType) => {
            const menuItems = grouped[menuType] || [];
            if (menuItems.length === 0) return null;

            return (
              <div key={menuType}>
                {menuType === 'admin' && (
                  <div className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider px-3 py-2">
                    Administration
                  </div>
                )}
                {menuItems.map((item) => {
                  const preview = previewState[item.key];
                  const iconPath = getPreviewIconPath(item);

                  return (
                    <button
                      key={item.key}
                      className="w-full flex items-center gap-2 px-2 py-2 mb-1 rounded-lg text-sm text-gray-600 dark:text-slate-200 font-medium hover:bg-gray-50 dark:hover:bg-slate-800"
                    >
                      <img
                        src={iconPath}
                        alt={preview.name || item.name}
                        className="w-4 h-4 object-contain opacity-50 flex-shrink-0"
                        onError={(e) => {
                          const fallbackSrc = `/icons/icon-${
                            item.defaultIcon || item.icon || 'dashboard'
                          }.png`;
                          if (e.currentTarget.src !== fallbackSrc) {
                            e.currentTarget.src = fallbackSrc;
                          } else {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }
                        }}
                      />
                      <span className="flex-1 text-left truncate text-xs">
                        {preview.name || item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="pb-3 px-3 flex-shrink-0 border-t border-gray-200 dark:border-slate-800 pt-3">
          <button
            onClick={handleSaveAll}
            disabled={savingAll}
            className="w-full inline-flex items-center justify-center rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {savingAll ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    );
  };

  // Render edit row
  const renderEditRow = (item: BasicSidebarConfig) => {
    const form = formState[item.key] || { name: '', icon: '' };
    const currentIconPreview =
      tempIconPreview[item.key] ||
      getIconUrl(item.iconUrl) ||
      `/icons/icon-${form.icon || item.defaultIcon || 'dashboard'}.png`;

    return (
      <div
        key={item.key}
        className="flex items-center gap-2.5 border border-gray-300 rounded-lg p-3 bg-white"
      >
        <div className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded bg-gray-50 flex-shrink-0">
          <img
            src={currentIconPreview}
            alt={form.name || item.label}
            className="w-7 h-7 object-contain"
            onError={(e) => {
              const fallbackSrc = `/icons/icon-${item.defaultIcon || item.icon || 'dashboard'}.png`;
              if (e.currentTarget.src !== fallbackSrc) {
                e.currentTarget.src = fallbackSrc;
              } else {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }
            }}
          />
        </div>
        <input
          type="text"
          value={form.name}
          onChange={(e) => handleInputChange(item.key, 'name', e.target.value)}
          placeholder={item.label}
          className="flex-1 border border-gray-300 px-3 py-2.5 text-sm rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 min-w-0"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleUpdatePreviewName(item);
            }
          }}
        />
        <input
          id={`icon-upload-${item.key}`}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/svg+xml"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleIconFileChange(item, file);
              // Auto upload and update preview after file selection
              await handleUploadAndUpdatePreview(item);
            }
            // Reset input to allow selecting the same file again
            e.target.value = '';
          }}
          disabled={uploadingKey === item.key || savingPreviewKey === item.key}
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => handleUpdatePreviewName(item)}
            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition"
            title="Confirm name change"
          >
            <Check className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              const fileInput = document.getElementById(
                `icon-upload-${item.key}`,
              ) as HTMLInputElement;
              if (fileInput) {
                fileInput.click();
              }
            }}
            disabled={uploadingKey === item.key || savingPreviewKey === item.key}
            className="inline-flex items-center justify-center rounded-lg border border-blue-500 bg-blue-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300 whitespace-nowrap"
          >
            {uploadingKey === item.key || savingPreviewKey === item.key ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
        Loading sidebar configuration...
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {error}
        <button onClick={loadItems} className="ml-3 text-indigo-600 underline" type="button">
          Try Again
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        No items available to edit.
      </div>
    );
  }

  return (
    <section className="bg-white p-4 shadow-md rounded-lg overflow-hidden">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-slate-800">Sidebar Management</h3>
        <p className="mt-1 text-sm text-slate-500">
          Change names and icons for sidebar items. Click "Save" to preview, then click "Save" to
          apply.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Left Panel - Edit Items */}
        <div className="flex flex-col h-full col-span-3 min-h-0">
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 min-h-0">
            {items.map((item) => renderEditRow(item))}
          </div>
        </div>

        {/* Right Panel - Sidebar Preview */}
        <div className="flex flex-col border-2 border-gray-300 rounded-lg h-full col-span-1 overflow-hidden bg-white min-h-0">
          <div className="flex-1 overflow-hidden min-h-0">{renderSidebarPreview()}</div>
        </div>
      </div>
    </section>
  );
};

export default SidebarManagementSettings;
