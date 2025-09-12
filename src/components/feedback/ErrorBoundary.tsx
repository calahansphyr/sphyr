/**
 * Feedback-specific Error Boundary Component
 * Wraps the shared ErrorBoundary with feedback-specific styling and behavior
 */

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ErrorBoundary as SharedErrorBoundary } from '@/components/shared/ErrorBoundary';
import { ErrorInfo } from 'react';

interface FeedbackErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  className?: string;
}

interface FeedbackErrorState {
  errorId: string;
  isReported: boolean;
}

class FeedbackErrorBoundary extends React.Component<FeedbackErrorBoundaryProps, FeedbackErrorState> {
  constructor(props: FeedbackErrorBoundaryProps) {
    super(props);
    this.state = {
      errorId: '',
      isReported: false
    };
  }

  handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Generate error ID for this specific error
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.setState({ errorId });

    // Call the parent error handler
    this.props.onError?.(error, errorInfo);
  };

  handleRetry = () => {
    // Reset the error boundary by forcing a re-render
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleCopyError = async () => {
    const errorDetails = {
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
      this.setState({ isReported: true });
      setTimeout(() => this.setState({ isReported: false }), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  renderFallback = () => {
    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className={cn("min-h-screen bg-gray-50 flex items-center justify-center p-4", this.props.className)}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </motion.div>
              <CardTitle className="text-2xl font-bold text-red-900">
                Oops! Something went wrong
              </CardTitle>
              <CardDescription className="text-red-700">
                We encountered an unexpected error. Don&apos;t worry, we&apos;re working to fix it.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error Details */}
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <Bug className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-900">Error Details</span>
                </div>
                <div className="text-sm text-red-700 space-y-1">
                  <p><strong>Error ID:</strong> {this.state.errorId}</p>
                  <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1 bg-[#3A8FCD] hover:bg-[#4D70B6] text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1 border-gray-300 hover:bg-gray-50"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
                
                <Button
                  onClick={this.handleCopyError}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <AnimatePresence mode="wait">
                    {this.state.isReported ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="flex items-center"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="flex items-center"
                      >
                        <Copy className="h-4 w-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center text-sm text-gray-600">
                <p>
                  If this problem persists, please contact support with the Error ID above.
                </p>
                <p className="mt-1">
                  We apologize for any inconvenience.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  };

  render() {
    return (
      <SharedErrorBoundary
        fallback={this.renderFallback()}
        onError={this.handleError}
        maxRetries={3}
        resetOnPropsChange={true}
      >
        {this.props.children}
      </SharedErrorBoundary>
    );
  }
}

export default FeedbackErrorBoundary;
