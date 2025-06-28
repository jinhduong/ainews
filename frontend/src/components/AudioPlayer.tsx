import React, { useState, useRef, useEffect } from 'react';
import analyticsService from '../services/analyticsService';

interface AudioPlayerProps {
  articleId: string;
  title: string;
  audioPath?: string;
  className?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ articleId, title: _, audioPath, className = '' }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioLoaded, setAudioLoaded] = useState(false); // Track if audio src has been set

  // Smart audio URL detection
  const getAudioUrl = () => {
    // If audioPath is provided and is a full URL (Supabase), use it directly
    if (audioPath && (audioPath.startsWith('https://') || audioPath.startsWith('http://'))) {
      return audioPath;
    }
    
    // Otherwise, use the API endpoint (for local files or fallback)
    const getApiBaseUrl = () => {
      if (typeof window !== 'undefined') {
        if (window.location.hostname === 'localhost') {
          return 'http://localhost:3000/api/v1';
        }
      }
      return 'https://ainews-one.vercel.app/api/v1';
    };
    
    return `${getApiBaseUrl()}/audio/${articleId}`;
  };

  // Update current time as audio plays
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
      // Track audio completion
      analyticsService.trackAudioEnd(articleId);
    });

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      setError(null);
      
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        // Track audio pause/end
        analyticsService.trackAudioPause(articleId);
      } else {
        setIsLoading(true);
        
        // If this is the first time playing, set the audio source
        if (!audioLoaded) {
          const audioUrl = getAudioUrl();
          console.log('Setting audio source:', audioUrl);
          audio.src = audioUrl;
          setAudioLoaded(true);
        }
        
        // Try to play the audio
        await audio.play();
        setIsPlaying(true);
        // Track audio start
        analyticsService.trackAudioStart(articleId);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Audio playback error:', err);
      setError('Failed to play audio');
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration || !isFinite(duration)) return;

    const newTime = (parseFloat(e.target.value) / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number): string => {
    if (isNaN(time) || !isFinite(time) || time < 0) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 && isFinite(duration) ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Audio element without src initially - src will be set when user clicks play */}
      <audio
        ref={audioRef}
        preload="none"
        onError={(e) => {
          console.error('Audio element error:', e);
          setError('Audio not available');
          setIsLoading(false);
          setIsPlaying(false);
        }}
        onLoadStart={() => {
          console.log('Audio loading started...');
          setIsLoading(true);
        }}
        onCanPlay={() => {
          console.log('Audio can play');
          setIsLoading(false);
        }}
        onLoadedMetadata={() => {
          console.log('Audio metadata loaded');
        }}
        onWaiting={() => {
          console.log('Audio waiting for data...');
          setIsLoading(true);
        }}
        onPlaying={() => {
          console.log('Audio playing');
          setIsLoading(false);
        }}
      />
      
      <div className="flex items-center space-x-3">
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          disabled={isLoading || !!error}
          className={`
            flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200
            ${isLoading || error 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:ring-blue-200'
            }
          `}
          title={error ? error : isPlaying ? 'Pause' : (!audioLoaded ? 'Generate and play audio' : 'Play audio')}
        >
          {isLoading ? (
            <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
            </svg>
          ) : error ? (
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ) : isPlaying ? (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Progress and Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span className="truncate flex items-center">
              <svg className="w-4 h-4 text-blue-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14l9-5-9-5-9 5 9 5z"/>
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
              </svg>
              {audioLoaded ? 'Audio Summary' : 'Listen'}
            </span>
            <span className="text-xs">
              {formatTime(currentTime)} / {duration > 0 ? formatTime(duration) : '--:--'}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={progressPercentage}
              onChange={handleSeek}
              disabled={!duration || !isFinite(duration) || !!error}
              className={`
                w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                ${!duration || !isFinite(duration) || error ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              style={{
                background: duration && isFinite(duration) && !error
                  ? `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${progressPercentage}%, #E5E7EB ${progressPercentage}%, #E5E7EB 100%)`
                  : '#E5E7EB'
              }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-2 text-xs text-red-600 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};

export default AudioPlayer; 