/**
 * Home Page
 * Main landing page with navigation to search functionality
 */

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { MainLayout } from '@/components/layout';
import { GlobalSearchBar } from '@/components/search';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Brain, 
  Zap, 
  Globe, 
  ArrowRight,
  CheckCircle
} from 'lucide-react';

export default function HomePage(): React.JSX.Element {
  const handleSearch = (query: string) => {
    // Navigate to search page with query
    window.location.href = `/search?q=${encodeURIComponent(query)}`;
  };

  return (
    <>
      <Head>
        <title>Sphyr - AI-Powered Search Platform</title>
        <meta name="description" content="Search across all your connected business tools and integrations with the power of AI. Find anything, anywhere, instantly." />
      </Head>
      <MainLayout>
        <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-text-primary">
                AI-Powered Search Platform
              </h1>
            </div>
            
            <p className="text-xl text-text-secondary mb-8 max-w-3xl mx-auto">
              Search across all your connected business tools and integrations with the power of AI. 
              Find anything, anywhere, instantly.
            </p>
            
            {/* Global Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <GlobalSearchBar
                placeholder="Search across all your connected platforms..."
                onSearch={handleSearch}
                size="large"
                showAIBranding={true}
                showSuggestions={true}
                className="shadow-lg"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => handleSearch('')}>
                <Search className="mr-2 h-5 w-5" />
                Start Searching
              </Button>
              
              <Button variant="outline" size="lg" asChild>
                <Link href="/dashboard">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  View Dashboard
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <div className="py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-center text-text-primary mb-12">
              Why Choose Sphyr?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-primary-500" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  Universal Search
                </h3>
                <p className="text-text-secondary">
                  Search across all your connected tools from a single interface
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-accent-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-accent-green" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  AI-Powered
                </h3>
                <p className="text-text-secondary">
                  Intelligent query processing and result ranking with advanced AI
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-accent-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-accent-purple" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  Lightning Fast
                </h3>
                <p className="text-text-secondary">
                  Get results instantly with optimized search and caching
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Benefits Section */}
        <div className="py-16 bg-background-secondary rounded-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold text-text-primary mb-8">
              Transform Your Workflow
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-accent-green mt-1" />
                  <div>
                    <h3 className="font-semibold text-text-primary">Save Time</h3>
                    <p className="text-text-secondary">Find documents and information 10x faster than traditional search</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-accent-green mt-1" />
                  <div>
                    <h3 className="font-semibold text-text-primary">Stay Organized</h3>
                    <p className="text-text-secondary">Keep all your business tools connected and searchable in one place</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-accent-green mt-1" />
                  <div>
                    <h3 className="font-semibold text-text-primary">Make Better Decisions</h3>
                    <p className="text-text-secondary">Access all relevant information instantly for informed decision-making</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-accent-green mt-1" />
                  <div>
                    <h3 className="font-semibold text-text-primary">Secure & Private</h3>
                    <p className="text-text-secondary">Enterprise-grade security with complete data privacy protection</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-accent-green mt-1" />
                  <div>
                    <h3 className="font-semibold text-text-primary">Easy Integration</h3>
                    <p className="text-text-secondary">Connect your favorite tools in minutes with our simple setup</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-accent-green mt-1" />
                  <div>
                    <h3 className="font-semibold text-text-primary">Smart Insights</h3>
                    <p className="text-text-secondary">Get AI-powered insights and recommendations from your data</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTA Section */}
        <div className="py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
              Join thousands of teams who have transformed their workflow with Sphyr
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => handleSearch('')}>
                <Search className="mr-2 h-5 w-5" />
                Start Searching Now
              </Button>
              
              <Button variant="outline" size="lg" asChild>
                <Link href="/integrations">
                  <Globe className="mr-2 h-5 w-5" />
                  Connect Your Tools
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
    </>
  );
}
