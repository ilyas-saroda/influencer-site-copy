import React, { useState } from 'react';
import { Link2, Search, AlertCircle, CheckCircle2, Copy, Download } from 'lucide-react';
import Sidebar from '../../components/ui/Sidebar';
import Header from '../../components/ui/Header';
import { creatorService } from '../../services/creatorService';

const BulkInstagramProcessor = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [inputText, setInputText] = useState('');
  const [searchType, setSearchType] = useState('link'); // 'link' or 'username'
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!inputText?.trim()) {
      setError(`Please enter at least one ${searchType === 'link' ? 'Instagram link' : 'username'}`);
      return;
    }

    setLoading(true);
    setError('');
    setSearchResults(null);

    try {
      // Split by new lines and filter out empty lines
      const itemsArray = inputText?.split('\n')?.map(item => item?.trim())?.filter(item => item?.length > 0);

      if (itemsArray?.length === 0) {
        setError(`No valid ${searchType === 'link' ? 'Instagram links' : 'usernames'} found`);
        setLoading(false);
        return;
      }

      let results;
      if (searchType === 'link') {
        results = await creatorService?.searchByInstagramLinks(itemsArray);
      } else {
        results = await creatorService?.searchByUsernames(itemsArray);
      }
      setSearchResults(results);
    } catch (err) {
      setError(err?.message || 'Failed to search creators');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResults = () => {
    if (!searchResults?.found || searchResults?.found?.length === 0) return;

    const resultText = searchResults?.found?.map(creator => 
        `${creator?.name || 'N/A'} | ${creator?.instagram_link || 'N/A'} | ${creator?.followers_tier || 'N/A'} | ${creator?.city || 'N/A'}, ${creator?.state || 'N/A'}`
      )?.join('\n');

    navigator.clipboard?.writeText(resultText);
  };

  const handleExportCSV = () => {
    if (!searchResults?.found || searchResults?.found?.length === 0) return;

    const headers = ['sr_no', 'name', 'instagram_link', 'followers_tier', 'state', 'city', 'whatsapp', 'email', 'gender', 'username', 'sheet_source'];
    const csvContent = [
      headers?.join(','),
      ...searchResults?.found?.map(creator =>
        headers?.map(header => `"${creator?.[header] || ''}"`)?.join(',')
      )
    ]?.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL?.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-search-results-${Date.now()}.csv`;
    a?.click();
    window.URL?.revokeObjectURL(url);
  };

  const handleClear = () => {
    setInputText('');
    setSearchResults(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <Header />
        
        <main className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Link2 className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Bulk Instagram Link Processor</h1>
            </div>
            <p className="text-gray-600">
              Paste multiple Instagram links (one per line) to search and display creator details from database
            </p>
          </div>

          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="mb-6 flex gap-4">
              <button
                onClick={() => setSearchType('link')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  searchType === 'link' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                }`}
              >
                <Link2 className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-semibold">Bulk Link Search</span>
              </button>
              <button
                onClick={() => setSearchType('username')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  searchType === 'username' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                }`}
              >
                <Search className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-semibold">Bulk Username Search</span>
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {searchType === 'link' ? 'Instagram Links' : 'Usernames'} (One per line)
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e?.target?.value)}
                placeholder={
                  searchType === 'link' 
                    ? "https://www.instagram.com/username1/\nhttps://www.instagram.com/username2/"
                    : "username1\nusername2\n@username3"
                }
                className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                disabled={loading}
              />
              <p className="mt-2 text-xs text-gray-500">
                {inputText?.split('\n')?.filter(line => line?.trim())?.length} items entered
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSearch}
                disabled={loading || !inputText?.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Search className="w-4 h-4" />
                {loading ? 'Searching...' : 'Search Creators'}
              </button>
              <button
                onClick={handleClear}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Results Section */}
          {searchResults && (
            <div className="space-y-6">
              {/* Results Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Searched</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {(searchResults?.found?.length || 0) + (searchResults?.notFound?.length || 0)}
                      </p>
                    </div>
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Found</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        {searchResults?.found?.length || 0}
                      </p>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Not Found</p>
                      <p className="text-2xl font-bold text-orange-600 mt-1">
                        {searchResults?.notFound?.length || 0}
                      </p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-orange-400" />
                  </div>
                </div>
              </div>

              {/* Found Creators Table */}
              {searchResults?.found?.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Found Creators ({searchResults?.found?.length})
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyResults}
                        className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                      <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Export CSV
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">sr_no</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">instagram_link</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">followers_tier</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">state</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">city</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">whatsapp</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">gender</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">username</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">sheet_source</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {searchResults?.found?.map((creator, index) => (
                          <tr key={creator?.id || index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{creator?.sr_no || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{creator?.name || '-'}</td>
                            <td className="px-4 py-3 text-sm">
                              <a 
                                href={creator?.instagram_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline truncate block max-w-xs"
                              >
                                {creator?.instagram_link || '-'}
                              </a>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{creator?.followers_tier || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{creator?.state || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{creator?.city || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{creator?.whatsapp || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{creator?.email || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{creator?.gender || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{creator?.username || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{creator?.sheet_source || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Not Found Links */}
              {searchResults?.notFound?.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Not Found ({searchResults?.notFound?.length})
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {searchResults?.notFound?.map((link, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                          <span className="text-gray-700 truncate">{link}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BulkInstagramProcessor;
