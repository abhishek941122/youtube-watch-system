import React, { useState } from 'react';
import Card from './Card.jsx';
import Input from './Input.jsx';
import Button from './Button.jsx';
import Loader from './Loader.jsx';
import { updateRoomVideoApi } from '../services/api.js';
import { extractYouTubeId } from '../utils/helpers.js';
import { Video, AlertCircle, CheckCircle2, Link2 } from 'lucide-react';
import { toast } from 'sonner';

export const HostVideoControls = ({ roomId, onVideoLoaded }) => {
  const [videoInput, setVideoInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLoadVideo = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedInput = videoInput.trim();
    if (!trimmedInput) {
      toast.warning('Load a YouTube video first.');
      setError('Please enter a YouTube video URL or Video ID.');
      return;
    }

    const videoId = extractYouTubeId(trimmedInput);

    if (!videoId) {
      toast.error('Unable to load YouTube video.');
      setError('Invalid YouTube URL or Video ID. Please check the link and try again.');
      return;
    }

    try {
      setLoading(true);
      const res = await updateRoomVideoApi(roomId, videoId);
      if (res.success) {
        setVideoInput('');
        setSuccessMsg('Video loaded successfully!');
        toast.success('Video synchronized successfully.');
        if (onVideoLoaded) {
          onVideoLoaded(videoId, res.data);
        }
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        toast.error('Unable to load YouTube video.');
        setError(res.message || 'Failed to update video.');
      }
    } catch (err) {
      toast.error('Unable to load YouTube video.');
      const msg = err.response?.data?.message || err.message || 'Network error. Failed to load video.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Playback Controls"
      subtitle="Paste a YouTube video URL or Video ID to sync for all participants"
      headerAction={<Video className="w-5 h-5 text-indigo-400" />}
    >
      <form onSubmit={handleLoadVideo} className="space-y-3">
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm shadow-sm animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center space-x-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm shadow-sm animate-fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1 w-full">
            <Input
              label="YouTube Video Link or ID"
              placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              value={videoInput}
              onChange={(e) => {
                setVideoInput(e.target.value);
                if (error) setError('');
              }}
              disabled={loading}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            className="w-full sm:w-auto shrink-0 mb-[2px]"
            disabled={loading}
          >
            {loading ? (
              <Loader size="sm" text="Loading..." />
            ) : (
              <>
                <Link2 className="w-4 h-4 mr-2" />
                Load Video
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default HostVideoControls;
