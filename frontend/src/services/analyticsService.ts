// API configuration - environment-based URL selection
const getApiBaseUrl = () => {
  // Check if we're in development mode (localhost)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000/api/v1';
  }
  // Production environment (Vercel deployment)
  return 'https://ainews-one.vercel.app/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

interface AudioSession {
  articleId: string;
  startTime: number;
}

class AnalyticsService {
  private audioSessions: Map<string, AudioSession> = new Map();

  /**
   * Track page view
   */
  async trackPageView(page: 'home' | 'detail'): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/analytics/page-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ page }),
      });
    } catch (error) {
      console.warn('Failed to track page view:', error);
    }
  }

  /**
   * Track audio playback start
   */
  async trackAudioStart(articleId: string): Promise<void> {
    try {
      // Record session start time
      this.audioSessions.set(articleId, {
        articleId,
        startTime: Date.now(),
      });

      await fetch(`${API_BASE_URL}/analytics/audio-start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.warn('Failed to track audio start:', error);
    }
  }

  /**
   * Track audio playback end
   */
  async trackAudioEnd(articleId: string): Promise<void> {
    try {
      const session = this.audioSessions.get(articleId);
      if (!session) return;

      const listeningTimeMinutes = (Date.now() - session.startTime) / (1000 * 60);
      
      await fetch(`${API_BASE_URL}/analytics/audio-end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listeningTimeMinutes }),
      });

      // Clean up session
      this.audioSessions.delete(articleId);
    } catch (error) {
      console.warn('Failed to track audio end:', error);
    }
  }

  /**
   * Track when user pauses audio
   */
  async trackAudioPause(articleId: string): Promise<void> {
    // For now, treat pause as end to track partial listening time
    await this.trackAudioEnd(articleId);
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService; 