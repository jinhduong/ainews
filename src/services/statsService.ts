import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

interface NewsCollectionStats {
  totalRuns: number;
  lastRunTime: string | null;
  lastRunDuration: number;
  articlesProcessed: number;
  newArticlesFound: number;
  duplicatesSkipped: number;
  oldArticlesRemoved: number;
  errors: number;
  nextScheduledRun: string;
}

interface ApiUsageStats {
  newsApi: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    lastCallTime: string | null;
    articlesRetrieved: number;
  };
  openAi: {
    summaryGeneration: {
      totalCalls: number;
      successfulCalls: number;
      failedCalls: number;
      tokensUsed: number;
      lastCallTime: string | null;
    };
    audioGeneration: {
      totalCalls: number;
      successfulCalls: number;
      failedCalls: number;
      audioFilesGenerated: number;
      totalAudioDurationMinutes: number;
      lastCallTime: string | null;
    };
  };
}

interface UserAnalytics {
  pageViews: {
    homePage: number;
    detailPage: number;
    totalUniqueVisitors: number;
  };
  audioPlayback: {
    totalPlays: number;
    uniqueArticlesPlayed: Set<string>;
    currentlyListening: number;
    totalListeningTimeMinutes: number;
  };
  apiRequests: {
    newsEndpoint: number;
    audioEndpoint: number;
    statsEndpoint: number;
  };
}

interface SystemStats {
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  articleStorage: {
    totalArticles: number;
    totalCategories: number;
    storageSize: string;
  };
  audioStorage: {
    totalFiles: number;
    storageSize: string;
  };
}

interface DashboardStats {
  newsCollection: NewsCollectionStats;
  apiUsage: ApiUsageStats;
  userAnalytics: UserAnalytics;
  systemStats: SystemStats;
  lastUpdated: string;
}

class StatsService {
  private stats: DashboardStats;
  private startTime: number;
  private statsFilePath: string;

  constructor() {
    this.startTime = Date.now();
    this.statsFilePath = path.join(process.cwd(), 'data', 'stats.json');
    this.stats = this.initializeStats();
    this.loadPersistedStats();
    
    // Save stats every 5 minutes
    setInterval(() => {
      this.persistStats();
    }, 5 * 60 * 1000);
  }

  private initializeStats(): DashboardStats {
    return {
      newsCollection: {
        totalRuns: 0,
        lastRunTime: null,
        lastRunDuration: 0,
        articlesProcessed: 0,
        newArticlesFound: 0,
        duplicatesSkipped: 0,
        oldArticlesRemoved: 0,
        errors: 0,
        nextScheduledRun: this.getNextCronTime()
      },
      apiUsage: {
        newsApi: {
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          lastCallTime: null,
          articlesRetrieved: 0
        },
        openAi: {
          summaryGeneration: {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            tokensUsed: 0,
            lastCallTime: null
          },
          audioGeneration: {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            audioFilesGenerated: 0,
            totalAudioDurationMinutes: 0,
            lastCallTime: null
          }
        }
      },
      userAnalytics: {
        pageViews: {
          homePage: 0,
          detailPage: 0,
          totalUniqueVisitors: 0
        },
        audioPlayback: {
          totalPlays: 0,
          uniqueArticlesPlayed: new Set(),
          currentlyListening: 0,
          totalListeningTimeMinutes: 0
        },
        apiRequests: {
          newsEndpoint: 0,
          audioEndpoint: 0,
          statsEndpoint: 0
        }
      },
      systemStats: {
        uptime: 0,
        memoryUsage: process.memoryUsage(),
        articleStorage: {
          totalArticles: 0,
          totalCategories: 0,
          storageSize: '0 KB'
        },
        audioStorage: {
          totalFiles: 0,
          storageSize: '0 KB'
        }
      },
      lastUpdated: new Date().toISOString()
    };
  }

  private getNextCronTime(): string {
    const now = new Date();
    const next = new Date(now);
    next.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
    return next.toISOString();
  }

  private loadPersistedStats(): void {
    try {
      if (fs.existsSync(this.statsFilePath)) {
        const data = JSON.parse(fs.readFileSync(this.statsFilePath, 'utf8'));
        // Merge persisted stats with current stats, keeping runtime data fresh
        this.stats = {
          ...this.stats,
          ...data,
          userAnalytics: {
            ...this.stats.userAnalytics,
            audioPlayback: {
              ...data.userAnalytics?.audioPlayback,
              uniqueArticlesPlayed: new Set(data.userAnalytics?.audioPlayback?.uniqueArticlesPlayed || []),
              currentlyListening: 0 // Reset active listeners on restart
            }
          },
          systemStats: {
            ...this.stats.systemStats,
            uptime: 0 // Reset uptime on restart
          }
        };
        logger.info('📊 Loaded persisted stats from file');
      }
    } catch (error) {
      logger.error('❌ Error loading persisted stats:', error);
    }
  }

  private persistStats(): void {
    try {
      const dataDir = path.dirname(this.statsFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Convert Set to Array for JSON serialization
      const statsToSave = {
        ...this.stats,
        userAnalytics: {
          ...this.stats.userAnalytics,
          audioPlayback: {
            ...this.stats.userAnalytics.audioPlayback,
            uniqueArticlesPlayed: Array.from(this.stats.userAnalytics.audioPlayback.uniqueArticlesPlayed)
          }
        }
      };

      fs.writeFileSync(this.statsFilePath, JSON.stringify(statsToSave, null, 2));
    } catch (error) {
      logger.error('❌ Error persisting stats:', error);
    }
  }

  // News Collection Tracking
  recordNewsCollectionStart(): void {
    this.stats.newsCollection.totalRuns++;
    this.stats.newsCollection.lastRunTime = new Date().toISOString();
    this.updateNextScheduledRun();
  }

  recordNewsCollectionEnd(duration: number, newArticles: number, duplicates: number, removed: number): void {
    this.stats.newsCollection.lastRunDuration = duration;
    this.stats.newsCollection.newArticlesFound += newArticles;
    this.stats.newsCollection.duplicatesSkipped += duplicates;
    this.stats.newsCollection.oldArticlesRemoved += removed;
    this.stats.newsCollection.articlesProcessed += newArticles;
  }

  recordNewsCollectionError(): void {
    this.stats.newsCollection.errors++;
  }

  private updateNextScheduledRun(): void {
    this.stats.newsCollection.nextScheduledRun = this.getNextCronTime();
  }

  // API Usage Tracking
  recordNewsApiCall(success: boolean, articlesCount: number = 0): void {
    this.stats.apiUsage.newsApi.totalCalls++;
    this.stats.apiUsage.newsApi.lastCallTime = new Date().toISOString();
    
    if (success) {
      this.stats.apiUsage.newsApi.successfulCalls++;
      this.stats.apiUsage.newsApi.articlesRetrieved += articlesCount;
    } else {
      this.stats.apiUsage.newsApi.failedCalls++;
    }
  }

  recordOpenAiSummaryCall(success: boolean, tokensUsed: number = 0): void {
    this.stats.apiUsage.openAi.summaryGeneration.totalCalls++;
    this.stats.apiUsage.openAi.summaryGeneration.lastCallTime = new Date().toISOString();
    
    if (success) {
      this.stats.apiUsage.openAi.summaryGeneration.successfulCalls++;
      this.stats.apiUsage.openAi.summaryGeneration.tokensUsed += tokensUsed;
    } else {
      this.stats.apiUsage.openAi.summaryGeneration.failedCalls++;
    }
  }

  recordOpenAiAudioCall(success: boolean, durationMinutes: number = 0): void {
    this.stats.apiUsage.openAi.audioGeneration.totalCalls++;
    this.stats.apiUsage.openAi.audioGeneration.lastCallTime = new Date().toISOString();
    
    if (success) {
      this.stats.apiUsage.openAi.audioGeneration.successfulCalls++;
      this.stats.apiUsage.openAi.audioGeneration.audioFilesGenerated++;
      this.stats.apiUsage.openAi.audioGeneration.totalAudioDurationMinutes += durationMinutes;
    } else {
      this.stats.apiUsage.openAi.audioGeneration.failedCalls++;
    }
  }

  // User Analytics Tracking
  recordPageView(page: 'home' | 'detail'): void {
    if (page === 'home') {
      this.stats.userAnalytics.pageViews.homePage++;
    } else {
      this.stats.userAnalytics.pageViews.detailPage++;
    }
  }

  recordUniqueVisitor(): void {
    this.stats.userAnalytics.pageViews.totalUniqueVisitors++;
  }

  recordAudioPlay(articleId: string): void {
    this.stats.userAnalytics.audioPlayback.totalPlays++;
    this.stats.userAnalytics.audioPlayback.uniqueArticlesPlayed.add(articleId);
  }

  recordAudioStart(): void {
    this.stats.userAnalytics.audioPlayback.currentlyListening++;
  }

  recordAudioEnd(listeningTimeMinutes: number): void {
    this.stats.userAnalytics.audioPlayback.currentlyListening = Math.max(0, this.stats.userAnalytics.audioPlayback.currentlyListening - 1);
    this.stats.userAnalytics.audioPlayback.totalListeningTimeMinutes += listeningTimeMinutes;
  }

  recordApiRequest(endpoint: 'news' | 'audio' | 'stats'): void {
    this.stats.userAnalytics.apiRequests[`${endpoint}Endpoint`]++;
  }

  // System Stats (real-time)
  private updateSystemStats(): void {
    this.stats.systemStats.uptime = Date.now() - this.startTime;
    this.stats.systemStats.memoryUsage = process.memoryUsage();
    this.stats.lastUpdated = new Date().toISOString();
  }

  updateStorageStats(articleStorage: any, audioStorage: any): void {
    this.stats.systemStats.articleStorage = articleStorage;
    this.stats.systemStats.audioStorage = audioStorage;
  }

  // Get current stats
  getStats(): DashboardStats {
    this.updateSystemStats();
    return {
      ...this.stats,
      userAnalytics: {
        ...this.stats.userAnalytics,
        audioPlayback: {
          ...this.stats.userAnalytics.audioPlayback,
          uniqueArticlesPlayed: this.stats.userAnalytics.audioPlayback.uniqueArticlesPlayed
        }
      }
    };
  }

  // Manual trigger for news collection
  async triggerNewsCollection(): Promise<{ success: boolean; message: string }> {
    try {
      // Import here to avoid circular dependency
      const { collectAllNews } = await import('./newsCollector');
      
      logger.info('📊 Manual news collection triggered from dashboard');
      this.recordNewsCollectionStart();
      
      await collectAllNews();
      
      return {
        success: true,
        message: 'News collection triggered successfully'
      };
    } catch (error) {
      this.recordNewsCollectionError();
      logger.error('❌ Manual news collection failed:', error);
      return {
        success: false,
        message: `News collection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const statsService = new StatsService();
export default statsService; 