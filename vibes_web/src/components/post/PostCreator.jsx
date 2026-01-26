import { useState, useRef } from 'react';
import { Image, X, Loader2 } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';

export function PostCreator({ profile, onCreatePost, isLoading }) {
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !selectedImage) return;

    await onCreatePost(content, selectedImage);
    setContent('');
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="card p-4">
      <div className="flex gap-3">
        <Avatar
          src={profile?.profile_picture}
          name={profile?.username}
          size="sm"
        />
        <div className="flex-1">
          <div className="mb-2">
            <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
              @{profile?.username || 'user'}
            </span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full resize-none border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-slate-200 bg-white dark:bg-[#1E1E2E] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            rows={3}
          />
        </div>
      </div>

      {/* Image Preview */}
      {previewUrl && (
        <div className="mt-3 relative">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-48 object-cover rounded-xl"
          />
          <button
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Image className="w-5 h-5" />
          <span className="text-sm font-medium">Add Photo</span>
        </button>

        <Button
          onClick={handleSubmit}
          disabled={(!content.trim() && !selectedImage) || isLoading}
          loading={isLoading}
          size="sm"
        >
          Post
        </Button>
      </div>
    </div>
  );
}
