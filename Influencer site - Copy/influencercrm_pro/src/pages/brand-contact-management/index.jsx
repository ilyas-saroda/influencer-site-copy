import React, { useState, useEffect } from 'react';
import { Plus, Search, Building2, Users, Phone, Mail, Globe, Edit, Trash2, UserPlus } from 'lucide-react';
import { brandService, contactService } from '../../services/brandService';

export default function BrandContactManagement() {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      loadContacts(selectedBrand?.id);
    }
  }, [selectedBrand]);

  const loadBrands = async () => {
    try {
      setLoading(true);
      const data = await brandService?.getAll();
      setBrands(data);
      if (data?.length > 0 && !selectedBrand) {
        setSelectedBrand(data?.[0]);
      }
    } catch (err) {
      setError(err?.message);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async (brandId) => {
    try {
      const data = await contactService?.getByBrandId(brandId);
      setContacts(data);
    } catch (err) {
      setError(err?.message);
    }
  };

  const handleSearchBrands = async (query) => {
    setSearchQuery(query);
    if (!query?.trim()) {
      loadBrands();
      return;
    }
    try {
      const results = await brandService?.search(query);
      setBrands(results);
    } catch (err) {
      setError(err?.message);
    }
  };

  const handleDeleteBrand = async (brandId) => {
    if (!window.confirm('Are you sure you want to delete this brand and all its contacts?')) return;
    
    try {
      await brandService?.delete(brandId);
      await loadBrands();
      if (selectedBrand?.id === brandId) {
        setSelectedBrand(null);
        setContacts([]);
      }
    } catch (err) {
      setError(err?.message);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      await contactService?.delete(contactId);
      await loadContacts(selectedBrand?.id);
    } catch (err) {
      setError(err?.message);
    }
  };

  const handleSetPrimaryContact = async (contactId) => {
    try {
      await contactService?.setPrimary(selectedBrand?.id, contactId);
      await loadContacts(selectedBrand?.id);
    } catch (err) {
      setError(err?.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading brands...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Brand List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Brands
            </h2>
            <button
              onClick={() => setShowAddBrandModal(true)}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search brands..."
              value={searchQuery}
              onChange={(e) => handleSearchBrands(e?.target?.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {brands?.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No brands found
            </div>
          ) : (
            brands?.map((brand) => (
              <div
                key={brand?.id}
                onClick={() => setSelectedBrand(brand)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedBrand?.id === brand?.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{brand?.name}</h3>
                    <p className="text-sm text-gray-600">{brand?.industry}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      <span>{brand?.contactCount} contacts</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e?.stopPropagation();
                      handleDeleteBrand(brand?.id);
                    }}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Main Content - Brand Details & Contacts */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedBrand ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Select a brand to view details</p>
            </div>
          </div>
        ) : (
          <>
            {/* Brand Details Header */}
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{selectedBrand?.name}</h1>
                    <p className="text-gray-600">{selectedBrand?.industry}</p>
                  </div>
                </div>
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {selectedBrand?.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <a
                      href={selectedBrand?.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {selectedBrand?.website}
                    </a>
                  </div>
                )}
                {selectedBrand?.headquarters && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">HQ:</span>
                    <span>{selectedBrand?.headquarters}</span>
                  </div>
                )}
                {selectedBrand?.employeeCount && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{selectedBrand?.employeeCount} employees</span>
                  </div>
                )}
              </div>

              {selectedBrand?.description && (
                <p className="mt-4 text-gray-700">{selectedBrand?.description}</p>
              )}
            </div>

            {/* Contacts Section */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Contacts ({contacts?.length})
                </h2>
                <button
                  onClick={() => setShowAddContactModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Contact
                </button>
              </div>

              {contacts?.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">No contacts yet</p>
                  <p className="text-sm">Add the first contact for this brand</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contacts?.map((contact) => (
                    <div
                      key={contact?.id}
                      className={`bg-white rounded-lg border p-4 ${
                        contact?.isPrimary ? 'border-blue-500 shadow-sm' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{contact?.fullName}</h3>
                            {contact?.isPrimary && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                Primary
                              </span>
                            )}
                          </div>
                          {contact?.designation && (
                            <p className="text-sm text-gray-600">{contact?.designation}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {!contact?.isPrimary && (
                            <button
                              onClick={() => handleSetPrimaryContact(contact?.id)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded text-xs"
                              title="Set as primary"
                            >
                              Set Primary
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteContact(contact?.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {contact?.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <a href={`mailto:${contact?.email}`} className="hover:text-blue-600">
                              {contact?.email}
                            </a>
                          </div>
                        )}
                        {contact?.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <a href={`tel:${contact?.phone}`} className="hover:text-blue-600">
                              {contact?.phone}
                            </a>
                          </div>
                        )}
                        {contact?.whatsapp && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Phone className="w-4 h-4 text-green-500" />
                            <a
                              href={`https://wa.me/${contact?.whatsapp?.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-green-600"
                            >
                              {contact?.whatsapp}
                            </a>
                          </div>
                        )}
                      </div>

                      {contact?.notes && (
                        <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {contact?.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
}