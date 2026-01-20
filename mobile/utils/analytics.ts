// Analytics Helper for tracking user events and app metrics
// Replace with actual implementation (Firebase Analytics, Mixpanel, Segment, etc.)

export type EventName = 
  | 'screen_view'
  | 'login'
  | 'register'
  | 'logout'
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'product_created'
  | 'product_updated'
  | 'product_deleted'
  | 'invoice_created'
  | 'invoice_updated'
  | 'invoice_deleted'
  | 'invoice_sent'
  | 'expense_created'
  | 'expense_updated'
  | 'expense_deleted'
  | 'payment_made'
  | 'api_error'
  | 'app_error';

export interface AnalyticsEvent {
  name: EventName;
  params?: Record<string, any>;
  timestamp?: number;
}

class Analytics {
  private isInitialized = false;
  private userId: string | null = null;

  /**
   * Initialize analytics SDK
   * Call this once when the app starts
   */
  initialize() {
    if (this.isInitialized) {
      return;
    }

    // TODO: Initialize your analytics SDK here
    // Example for Firebase Analytics:
    // import analytics from '@react-native-firebase/analytics';
    // await analytics().setAnalyticsCollectionEnabled(true);
    
    // Example for Mixpanel:
    // import { Mixpanel } from 'mixpanel-react-native';
    // await Mixpanel.init('YOUR_PROJECT_TOKEN');

    this.isInitialized = true;
    console.log('[Analytics] Initialized');
  }

  /**
   * Set the user ID for tracking
   */
  setUserId(userId: string | null) {
    this.userId = userId;
    
    // TODO: Set user ID in your analytics SDK
    // analytics().setUserId(userId);
    // Mixpanel.identify(userId);
    
    if (userId) {
      console.log('[Analytics] User ID set:', userId);
    } else {
      console.log('[Analytics] User ID cleared');
    }
  }

  /**
   * Set user properties for segmentation
   */
  setUserProperties(properties: Record<string, any>) {
    // TODO: Set user properties in your analytics SDK
    // analytics().setUserProperties(properties);
    // Mixpanel.getPeople().set(properties);
    
    console.log('[Analytics] User properties set:', properties);
  }

  /**
   * Log a custom event
   */
  logEvent(eventName: EventName, params?: Record<string, any>) {
    if (!this.isInitialized) {
      console.warn('[Analytics] Not initialized. Call initialize() first.');
      return;
    }

    const event: AnalyticsEvent = {
      name: eventName,
      params: {
        ...params,
        user_id: this.userId,
      },
      timestamp: Date.now(),
    };

    // TODO: Log event to your analytics SDK
    // analytics().logEvent(eventName, event.params);
    // Mixpanel.track(eventName, event.params);
    
    console.log('[Analytics] Event logged:', event);
  }

  /**
   * Log screen view
   */
  logScreenView(screenName: string, screenClass?: string) {
    this.logEvent('screen_view', {
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
  }

  /**
   * Log error event
   */
  logError(error: Error | string, context?: Record<string, any>) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;

    this.logEvent('app_error', {
      error_message: errorMessage,
      error_stack: errorStack,
      ...context,
    });

    // TODO: Send to error tracking service
    // Sentry.captureException(error);
    // Bugsnag.notify(error);
  }

  /**
   * Log API error
   */
  logApiError(endpoint: string, statusCode: number, errorMessage: string) {
    this.logEvent('api_error', {
      endpoint,
      status_code: statusCode,
      error_message: errorMessage,
    });
  }

  /**
   * Track timing metrics
   */
  logTiming(category: string, variable: string, time: number) {
    // TODO: Log timing to your analytics SDK
    // analytics().logEvent('timing_complete', {
    //   category,
    //   variable,
    //   time,
    // });

    console.log(`[Analytics] Timing: ${category}.${variable} = ${time}ms`);
  }

  /**
   * Reset analytics (on logout)
   */
  reset() {
    this.userId = null;
    
    // TODO: Reset analytics SDK
    // analytics().resetAnalyticsData();
    // Mixpanel.reset();
    
    console.log('[Analytics] Reset');
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Helper function to measure async operations
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    analytics.logTiming('async_operation', name, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    analytics.logTiming('async_operation_failed', name, duration);
    throw error;
  }
}
