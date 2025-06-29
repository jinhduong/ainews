import React from 'react';
import { Play, Pause, X, Volume2 } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';
import { useTheme } from '../contexts/ThemeContext';

const FloatingAudioPlayer: React.FC = () => {
  const { 
    currentTrack, 
    isPlaying, 
    isLoading, 
    currentTime, 
    duration, 
    isVisible,
    togglePlayPause,
    seekTo,
    hidePlayer
  } = useAudio();
  
  const { isDarkMode } = useTheme();

  if (!isVisible || !currentTrack) {
    return null;
  }

  const formatTime = (time: number): string => {
    if (isNaN(time) || !isFinite(time) || time < 0) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 && isFinite(duration) ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!duration || !isFinite(duration)) return;
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    seekTo(newTime);
  };

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 transform transition-all duration-500 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      {/* Backdrop blur overlay */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
      
      {/* Player container */}
      <div className={`relative border-t transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-900/95 border-gray-700' 
          : 'bg-white/95 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              disabled={isLoading}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:scale-105 ${
                isLoading 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                {/* Audio Icon */}
                <Volume2 className={`w-4 h-4 flex-shrink-0 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                
                {/* Title */}
                <h3 className={`text-sm font-medium truncate ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {currentTrack.title}
                </h3>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs font-mono ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {formatTime(currentTime)}
                </span>
                
                <div className="flex-1 relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progressPercentage}
                    onChange={handleSeek}
                    disabled={!duration || !isFinite(duration)}
                    className={`
                      w-full h-1 bg-transparent appearance-none cursor-pointer rounded-full
                      ${!duration || !isFinite(duration) ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    style={{
                      background: duration && isFinite(duration)
                        ? `linear-gradient(to right, ${isDarkMode ? '#3B82F6' : '#2563EB'} 0%, ${isDarkMode ? '#3B82F6' : '#2563EB'} ${progressPercentage}%, ${isDarkMode ? '#374151' : '#E5E7EB'} ${progressPercentage}%, ${isDarkMode ? '#374151' : '#E5E7EB'} 100%)`
                        : isDarkMode ? '#374151' : '#E5E7EB'
                    }}
                  />
                </div>
                
                <span className={`text-xs font-mono ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {duration > 0 ? formatTime(duration) : '--:--'}
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={hidePlayer}
              className={`p-2 rounded-full transition-all duration-200 hover:scale-105 ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              aria-label="Close player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingAudioPlayer; 