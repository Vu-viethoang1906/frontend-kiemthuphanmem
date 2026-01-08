export const uploadLimits = {
	avatarMaxBytes: 50 * 1024 * 1024, // 50MB (matches BE multer avatar)
	importMaxBytes: 5 * 1024 * 1024, // 5MB (matches BE import.controller)
};

export function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	const value = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
	return `${value} ${sizes[i]}`;
}


