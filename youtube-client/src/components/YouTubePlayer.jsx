import React from "react";
import YouTube from "react-youtube";

export const YouTubePlayer = ({ videoId, onReady, onPlay, onPause }) => {
  if (!videoId) return null;

  const opts = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1,
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
      enablejsapi: 1,
      mute: 1,
      origin: window.location.origin,
    },
  };

  return (
    <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl shadow-indigo-950/40 border border-slate-800 transition-all duration-300 ease-out animate-fade-in">
      <YouTube
        key={videoId}
        videoId={videoId}
        opts={opts}
        onReady={onReady}
        onPlay={onPlay}
        onPause={onPause}
        className="w-full h-full aspect-video"
        iframeClassName="w-full h-full"
      />
    </div>
  );
};

export default YouTubePlayer;