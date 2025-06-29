import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { NewsItem } from '../types/news';

interface AudioContextType {
  currentTrack: NewsItem | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  isVisible: boolean;
  playTrack: (article: NewsItem) => void;
  pauseTrack: () => void;
  togglePlayPause: () => void;
  seekTo: (time: number) => void;
  hidePlayer: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<NewsItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Smart audio URL detection
  const getAudioUrl = (articleId: string, audioPath?: string) => {
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

  // Initialize audio element
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
    });

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

  const playTrack = async (article: NewsItem) => {
    try {
      setIsLoading(true);
      setCurrentTrack(article);
      setIsVisible(true);
      
      const audio = audioRef.current;
      if (!audio) return;

      // Set new audio source if different track
      if (!audioLoaded || currentTrack?.id !== article.id) {
        const audioUrl = getAudioUrl(article.id, article.audioPath);
        audio.src = audioUrl;
        setAudioLoaded(true);
        setCurrentTime(0);
      }

      await audio.play();
      setIsPlaying(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsLoading(false);
    }
  };

  const pauseTrack = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const togglePlayPause = async () => {
    if (isPlaying) {
      pauseTrack();
    } else if (currentTrack) {
      await playTrack(currentTrack);
    }
  };

  const seekTo = (time: number) => {
    const audio = audioRef.current;
    if (audio && duration && isFinite(duration)) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  };

  const hidePlayer = () => {
    pauseTrack();
    setIsVisible(false);
    setCurrentTrack(null);
    setAudioLoaded(false);
  };

  return (
    <AudioContext.Provider value={{
      currentTrack,
      isPlaying,
      isLoading,
      currentTime,
      duration,
      isVisible,
      playTrack,
      pauseTrack,
      togglePlayPause,
      seekTo,
      hidePlayer
    }}>
      {children}
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        preload="none"
        onError={() => {
          setIsLoading(false);
          setIsPlaying(false);
        }}
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
      />
    </AudioContext.Provider>
  );
};

export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}; 