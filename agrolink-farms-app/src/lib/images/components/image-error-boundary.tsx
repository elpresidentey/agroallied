'use client';

/**
 * ImageErrorBoundary - React error boundary for image components
 * Provides graceful degradation when image components fail
 */

import React, { Component, ReactNode } from 'react';
import { ImageError } from '../types';
import { globalImageErrorHandler } from '../utils/global-error-handler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ImageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error for monitoring
    console.error('ImageErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Report to global error handler
    globalImageErrorHandler.reportError(
      'ImageErrorBoundary',
      error,
      {
        errorInfo: errorInfo.componentStack,
        props: this.props
      }
    );

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center ${this.props.className || ''}`}>
          <div className="space-y-3">
            <div className="text-gray-400">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-sm text-gray-600">
              <div className="font-medium">Image unavailable</div>
              <div className="text-xs text-gray-500 mt-1">
                {this.state.error?.message || 'Something went wrong loading the image'}
              </div>
            </div>
            <button
              onClick={this.handleRetry}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withImageErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WithErrorBoundary = (props: P) => (
    <ImageErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </ImageErrorBoundary>
  );

  WithErrorBoundary.displayName = `withImageErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithErrorBoundary;
}

// Specialized error boundaries for different image component types

export const HeroImageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ImageErrorBoundary
    fallback={
      <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-green-600">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-green-700">
            <div className="text-lg font-semibold">AgroLink Farms</div>
            <div className="text-sm">Premium Farm Animals Direct from Trusted Farms</div>
          </div>
        </div>
      </div>
    }
    onError={(error, errorInfo) => {
      console.error('Hero image component error:', error, errorInfo);
    }}
  >
    {children}
  </ImageErrorBoundary>
);

export const CategoryImageErrorBoundary: React.FC<{ children: ReactNode; category?: string }> = ({ 
  children, 
  category 
}) => (
  <ImageErrorBoundary
    fallback={
      <div className="w-full h-full bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-gray-400">
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-xs text-gray-600 font-medium capitalize">
            {category || 'Category'}
          </div>
        </div>
      </div>
    }
    onError={(error, errorInfo) => {
      console.error(`Category image component error for ${category}:`, error, errorInfo);
    }}
  >
    {children}
  </ImageErrorBoundary>
);

export const SectionBackgroundErrorBoundary: React.FC<{ 
  children: ReactNode; 
  section?: string;
}> = ({ children, section }) => (
  <ImageErrorBoundary
    fallback={
      <div className="w-full min-h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-gray-400">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-gray-600">
              <div className="text-sm font-medium">Background image unavailable</div>
              <div className="text-xs text-gray-500 capitalize">
                {section ? `${section} section` : 'Section background'}
              </div>
            </div>
          </div>
        </div>
        {children}
      </div>
    }
    onError={(error, errorInfo) => {
      console.error(`Section background component error for ${section}:`, error, errorInfo);
    }}
  >
    {children}
  </ImageErrorBoundary>
);