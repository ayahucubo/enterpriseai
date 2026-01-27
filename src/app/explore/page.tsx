'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Menu } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Sidebar } from '@/components/layout/Sidebar';
import { AgentDetailModal } from '@/components/agent/AgentDetailModal';
import { AgentCard } from '@/components/agent/AgentCard';
import { useExplore, ExploreProvider } from '@/contexts/ExploreContext';
import type { Agent } from '@/lib/api/explore';

export default function ExplorePage() {
  return (
    <ExploreProvider>
      <ExploreContent />
    </ExploreProvider>
  );
}

function ExploreContent() {
  const router = useRouter();
  const {
    tabs,
    filteredAgents,
    selectedTab,
    setSelectedTab,
    searchQuery,
    setSearchQuery,
    isLoading
  } = useExplore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  return (
    <div className="bg-white dark:bg-gray-900">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <main className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-200 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <div className="flex-none bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between h-16 px-4">

            {/* KIRI */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <Menu size={20} className="text-gray-500" />
              </button>

              <Link href="/" className="flex items-center gap-2">
                <div className="relative w-20 h-10">
                  <Image
                    src="/icons/logo-sdx.jpeg"
                    alt="SDX Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Enterprise AI
                </h1>
              </Link>
            </div>

            {/* KANAN */}
            <div className="relative w-40 h-20">
              <Image
                src="/icons/logo-pelni.jpeg"
                alt="PELNI Logo"
                fill
                className="object-contain"
              />
            </div>

          </div>
        </div>

        {/* Main Content Container - Fixed width and centered */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full max-w-3xl mx-auto">
            {/* Header Section - Fixed height, no flex */}
            <div className="px-4 sm:px-6 pt-6">
              <div className="text-center mb-2">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Daftar Asisten AI</h1>
                <p className="text-gray-600 dark:text-gray-400 text-base min-h-[48px] px-4 sm:px-8">
                  Temukan dan pilih asisten AI yang sesuai dengan kebutuhan Kamu.
                </p>
              </div>
            </div>

            {/* Search input - Sticky */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 px-4 sm:px-6 py-2 z-10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Cari Asisten"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900"
                />
              </div>
            </div>

            {/* Content area */}
            <div className="px-4 sm:px-6 py-6">
              {/* Tabs - Fixed height scrollable container with better positioning */}
              <div className="relative mb-8">
                <div className="overflow-x-auto no-scrollbar py-1" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <div className="flex pb-1 gap-2">
                    {isLoading ? (
                      <div className="flex gap-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-8 w-28 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                        ))}
                      </div>
                    ) : (
                      tabs.sort((a, b) => a.sequence - b.sequence).map(tab => (
                        <button
                          key={tab.category_id}
                          onClick={() => setSelectedTab(tab)}
                          className={`py-1 px-4 rounded-full text-sm font-medium whitespace-nowrap ${selectedTab.category_id === tab.category_id
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                            }`}
                        >
                          {tab.category_name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Agents Grid */}
              <div className="space-y-12">
                {isLoading ? (
                  // Skeleton loading untuk agents
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
                          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
                          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  selectedTab.category_id === 0 ? (
                    // Tab "Semua" - Grouped by category
                    tabs.filter(tab => tab.category_id !== 0).map(category => (
                      <div key={category.category_id}>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                          {category.category_name}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                          {filteredAgents
                            .filter(agent => agent.category_id === category.category_id)
                            .map((agent) => (
                              <AgentCard
                                key={agent.id}
                                agent={agent}
                                onClick={() => setSelectedAgent(agent)}
                              />
                            ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    // Tab kategori spesifik
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {filteredAgents.map((agent) => (
                        <AgentCard
                          key={agent.id}
                          agent={agent}
                          onClick={() => setSelectedAgent(agent)}
                        />
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <AgentDetailModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onStartChat={() => router.push(`/chat?agent=${selectedAgent.id}`)}
        />
      )}
    </div>
  );
} 