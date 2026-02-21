"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import FamilyTree from './components/FamilyTree';
import TreeView from './components/TreeView';
import GraphView from './components/GraphView';
import Footer from './components/Footer';
import SearchBar, { SearchFilters } from './components/SearchBar';
import { useFamilyData, DataSource } from '../data/familyDataWithIds';
import AddPersonModal from './components/AddPersonModal';
import AboutModal from './components/AboutModal';
import LoginModal from './components/LoginModal';
import EditPersonModal from './components/EditPersonModal';
import {
  QueueListIcon, Squares2X2Icon, ArrowRightOnRectangleIcon,
  ShareIcon, PlusIcon, BookOpenIcon, UserCircleIcon,
} from '@heroicons/react/24/outline';
import { getFamilyFullName } from '@/utils/config';
import { searchFamilyData, createFilteredFamilyData, SearchResult } from '@/utils/search';
import { buildFamilyTree } from '@/utils/familyTree';
import { AUTH_CONFIG } from '@/utils/constants';
import { Person } from '@/types/family';

export default function Home() {
  const [viewMode, setViewMode] = useState<'list' | 'tree' | 'graph'>('list');
  const [dataSource, setDataSource] = useState<DataSource>('all');
  const { data: familyData, loading: dataLoading, error: dataError, refresh: refreshData } = useFamilyData(dataSource);

  // Auth state
  const [loggedInPersonId, setLoggedInPersonId] = useState<string | null>(null);
  const [loggedInName, setLoggedInName] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Edit state
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('about_seen');
    }
    return false;
  });

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchTerm: '',
    searchInInfo: true,
    selectedGenerations: [],
    yearRange: {}
  });
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const familyFullName = useMemo(() => getFamilyFullName(), []);

  const treeData = useMemo(() => {
    if (dataLoading || dataError || !familyData.generations.length) {
      return { generations: [{ title: "家族树", people: [] }] };
    }
    return buildFamilyTree(familyData);
  }, [familyData, dataLoading, dataError]);

  const filteredFamilyData = useMemo(() => {
    if (searchResults.length > 0) {
      return createFilteredFamilyData(familyData, searchResults);
    }
    return familyData;
  }, [familyData, searchResults]);

  const handleSearch = useCallback((term: string, filters: SearchFilters) => {
    setSearchTerm(term);
    setSearchFilters(filters);
  }, []);

  useEffect(() => {
    if (!dataLoading && !dataError && familyData.generations.length) {
      if (searchTerm || searchFilters.selectedGenerations.length > 0 ||
          searchFilters.yearRange.start || searchFilters.yearRange.end) {
        const results = searchFamilyData(familyData, searchTerm, searchFilters);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }
  }, [familyData, searchTerm, searchFilters, dataLoading, dataError]);

  // Restore login from localStorage
  useEffect(() => {
    const token = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      try {
        const data = JSON.parse(Buffer.from(token, 'base64').toString());
        if (data.personId && Date.now() < data.exp) {
          setLoggedInPersonId(data.personId);
          setLoggedInName(data.name || '');
          setAuthToken(token);
        } else {
          localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.AUTH_TIME);
        }
      } catch {
        localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      }
    }
  }, []);

  const handleLoginSuccess = useCallback((token: string, personId: string, name: string) => {
    localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
    localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.AUTH_TIME, Date.now().toString());
    setAuthToken(token);
    setLoggedInPersonId(personId);
    setLoggedInName(name);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.AUTH_TIME);
    setAuthToken('');
    setLoggedInPersonId(null);
    setLoggedInName('');
  }, []);

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm mb-4">
        <div className="max-w-7xl mx-auto px-4 py-6 relative">
          {/* Auth buttons - top right */}
          <div className="absolute right-4 top-4 flex items-center gap-2">
            {loggedInPersonId ? (
              <>
                <span className="text-xs text-blue-600 font-medium">{loggedInName}</span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-2 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-600 bg-white hover:bg-gray-50"
                >
                  <ArrowRightOnRectangleIcon className="h-3.5 w-3.5 mr-1" />
                  退出
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50"
              >
                <UserCircleIcon className="h-3.5 w-3.5 mr-1" />
                登录
              </button>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 text-center">
            {familyFullName}族谱
          </h1>
          <div className="mt-2 flex items-center justify-center gap-2">
            <p className="text-gray-500 text-sm tracking-wide">
              传承历史 · 延续文化
            </p>
            <button
              onClick={() => setShowAboutModal(true)}
              className="text-gray-400 hover:text-blue-500 transition-colors p-1 rounded-md hover:bg-blue-50"
              title="关于族谱"
            >
              <BookOpenIcon className="h-4 w-4" />
            </button>
          </div>
          {loggedInPersonId && (
            <p className="mt-1 text-blue-500 text-center text-xs">
              欢迎，{loggedInName}（登录后可编辑个人信息）
            </p>
          )}
          <div className="mt-6 flex justify-center gap-4 flex-wrap">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-l-md flex items-center ${
                  dataSource === 'all'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setDataSource('all')}
              >
                全家族
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-r-md flex items-center ${
                  dataSource === 'sanfang'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setDataSource('sanfang')}
              >
                三房
              </button>
            </div>
            <div className="inline-flex rounded-md shadow-sm">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-l-md flex items-center ${
                  viewMode === 'list'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setViewMode('list')}
              >
                <QueueListIcon className="h-4 w-4 mr-2" />
                列表
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium flex items-center ${
                  viewMode === 'tree'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setViewMode('tree')}
              >
                <Squares2X2Icon className="h-4 w-4 mr-2" />
                树状
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-r-md flex items-center ${
                  viewMode === 'graph'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setViewMode('graph')}
              >
                <ShareIcon className="h-4 w-4 mr-2" />
                图谱
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-grow">
        {dataError && (
          <div className="text-center text-red-500 mb-4">
            {dataError} - 使用默认数据
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 mb-6">
          <div className="flex justify-end items-center gap-3 mb-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              添加人物
            </button>
            <SearchBar
              onSearch={handleSearch}
              generations={familyData.generations.map(g => g.title)}
            />
          </div>

          {searchResults.length === 0 && (searchTerm || searchFilters.selectedGenerations.length > 0 ||
           searchFilters.yearRange.start || searchFilters.yearRange.end) && (
            <div className="text-center text-gray-500 py-8">
              <p className="text-lg">未找到匹配的家族成员</p>
              <p className="text-sm">请尝试修改搜索条件</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="text-sm text-gray-600 text-center mb-4">
              找到 <span className="font-medium text-blue-600">{searchResults.length}</span> 个匹配结果
            </div>
          )}
        </div>

        {viewMode === 'list' && (
          <FamilyTree
            familyData={filteredFamilyData}
            searchTerm={searchTerm}
            searchInInfo={searchFilters.searchInInfo}
            loggedInPersonId={loggedInPersonId}
            onEditPerson={(person) => setEditingPerson(person)}
          />
        )}
        {viewMode === 'tree' && (
          <TreeView
            data={treeData}
            searchTerm={searchTerm}
            searchInInfo={searchFilters.searchInInfo}
          />
        )}
        {viewMode === 'graph' && (
          <GraphView data={treeData} />
        )}
      </div>

      <Footer />

      <AboutModal
        open={showAboutModal}
        onClose={() => {
          setShowAboutModal(false);
          localStorage.setItem('about_seen', '1');
        }}
      />

      <AddPersonModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={refreshData}
        familyData={familyData}
        dataSource={dataSource}
      />

      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        familyData={familyData}
      />

      {editingPerson && (
        <EditPersonModal
          open={true}
          onClose={() => setEditingPerson(null)}
          onSuccess={refreshData}
          person={editingPerson}
          dataSource={dataSource}
          token={authToken}
        />
      )}
    </main>
  );
}
