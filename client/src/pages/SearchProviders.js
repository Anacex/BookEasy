import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { providersAPI } from '../services/api';
import { Search, MapPin, Star, Clock, Filter } from 'lucide-react';

const SearchProviders = () => {
  const [searchParams, setSearchParams] = useState({
    service: '',
    city: '',
    state: '',
    sortBy: 'rating',
    page: 1
  });

  const { data, isLoading, error } = useQuery(
    ['providers', searchParams],
    () => providersAPI.search(searchParams),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(prev => ({ ...prev, page: 1 }));
  };

  const handleInputChange = (field, value) => {
    setSearchParams(prev => ({ ...prev, [field]: value }));
  };

  const handleSortChange = (sortBy) => {
    setSearchParams(prev => ({ ...prev, sortBy, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setSearchParams(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="page-container section-padding">
        {/* Search Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Find Service Providers</h1>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., Haircut, Tutoring, Plumbing"
                    className="input-field pl-10"
                    value={searchParams.service}
                    onChange={(e) => handleInputChange('service', e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  placeholder="Enter city"
                  className="input-field"
                  value={searchParams.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  placeholder="Enter state"
                  className="input-field"
                  value={searchParams.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <button
                type="submit"
                className="btn-primary flex items-center"
              >
                <Search className="w-4 h-4 mr-2" />
                Search Providers
              </button>
              
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={searchParams.sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="rating">Rating</option>
                  <option value="distance">Distance</option>
                  <option value="price">Price</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="loading-spinner"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">Error loading providers. Please try again.</p>
            </div>
          ) : data?.providers?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No providers found matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {data?.providers?.map((provider) => (
                  <div key={provider._id} className="card-hover">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <img
                          src={provider.user?.profileImage || '/default-avatar.png'}
                          alt={provider.businessName}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {provider.businessName}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {provider.user?.firstName} {provider.user?.lastName}
                        </p>
                        
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-sm text-gray-600">
                              {provider.rating.average.toFixed(1)} ({provider.rating.count})
                            </span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-1" />
                            {provider.location.address.city}, {provider.location.address.state}
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <div className="text-sm text-gray-600 mb-2">
                            Services: {provider.services.length}
                          </div>
                          <div className="text-sm text-gray-500">
                            From ${Math.min(...provider.services.map(s => s.price))}
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <Link
                            to={`/provider/${provider._id}`}
                            className="btn-primary text-sm py-2 px-4"
                          >
                            View Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {data?.pagination && data.pagination.pages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8">
                  <button
                    onClick={() => handlePageChange(searchParams.page - 1)}
                    disabled={searchParams.page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: data.pagination.pages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 border rounded-md text-sm font-medium ${
                        page === searchParams.page
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(searchParams.page + 1)}
                    disabled={searchParams.page === data.pagination.pages}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchProviders;

