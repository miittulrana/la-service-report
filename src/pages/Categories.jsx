import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getDamageAlertStatus, formatCcType } from '../lib/utils';
import { AlertCircle, Plus, X, Trash2, FileDown, ChevronDown } from 'lucide-react';
import { useDebounce } from '../lib/performance';
import DateRangePicker from '../components/ui/DateRangePicker';
import { generateServiceReport } from '../lib/pdfUtils';
import SingleDateFilter from '../components/ui/SingleDateFilter';

function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [newScooterId, setNewScooterId] = useState('');
  const [newScooterCcType, setNewScooterCcType] = useState('125cc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [scooterToDelete, setScooterToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [exportingCategory, setExportingCategory] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      const scooterPromises = categoriesData.map(category =>
        supabase
          .from('scooters')
          .select(`
            *,
            services(
              id,
              current_km,
              next_km,
              service_date
            ),
            damages(*)
          `)
          .eq('category_id', category.id)
          .order('id')
      );

      const scooterResults = await Promise.all(scooterPromises);
      
      categoriesData.forEach((category, index) => {
        if (!scooterResults[index].error) {
          category.scooters = scooterResults[index].data;
        }
      });

      setCategories(categoriesData);
    } catch (error) {
      console.error('Error:', error);
      alert('Error fetching categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleExport = async (startDate, endDate) => {
    if (!exportingCategory) return;
    
    try {
      setIsExporting(true);
      
      const { data: categoryScooters, error: scootersError } = await supabase
        .from('scooters')
        .select('id')
        .eq('category_id', exportingCategory.id);

      if (scootersError) throw scootersError;

      const scooterIds = categoryScooters.map(s => s.id);
      
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          scooter:scooters(
            id,
            category:categories(name),
            damages(
              id,
              description,
              created_at,
              resolved
            )
          )
        `)
        .in('scooter_id', scooterIds)
        .gte('service_date', startDate)
        .lte('service_date', endDate)
        .order('service_date', { ascending: false });

      if (servicesError) throw servicesError;

      await generateServiceReport({
        categoryName: exportingCategory.name,
        dateRange: { startDate, endDate },
        services: services,
      });

    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting service history');
    } finally {
      setIsExporting(false);
      setShowDatePicker(false);
      setExportingCategory(null);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleClearDate = () => {
    setSelectedDate(null);
  };

  const handleAddScooter = async (e) => {
    e.preventDefault();
    try {
      const { data: existingScooter } = await supabase
        .from('scooters')
        .select('id')
        .eq('id', newScooterId)
        .single();

      if (existingScooter) {
        alert('A scooter with this ID already exists');
        return;
      }

      let ccType = newScooterCcType;
      if (selectedCategoryName === 'Bolt') {
        ccType = '125cc BOLT';
      }

      const { error } = await supabase
        .from('scooters')
        .insert([{
          id: newScooterId,
          category_id: selectedCategory,
          status: 'active',
          cc_type: ccType
        }]);

      if (error) throw error;

      setNewScooterId('');
      setNewScooterCcType('125cc');
      setShowAddModal(false);
      setSelectedCategory(null);
      setSelectedCategoryName('');
      fetchCategories();
    } catch (error) {
      console.error('Error adding scooter:', error);
      alert('Error adding scooter');
    }
  };

  const handleDeleteClick = (e, scooter) => {
    e.stopPropagation();
    setScooterToDelete(scooter);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!scooterToDelete) return;
    
    try {
      setIsDeleting(true);

      await Promise.all([
        supabase
          .from('services')
          .delete()
          .eq('scooter_id', scooterToDelete.id),
        supabase
          .from('damages')
          .delete()
          .eq('scooter_id', scooterToDelete.id)
      ]);

      const { error } = await supabase
        .from('scooters')
        .delete()
        .eq('id', scooterToDelete.id);

      if (error) throw error;

      setShowDeleteModal(false);
      setScooterToDelete(null);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting scooter:', error);
      alert('Error deleting scooter');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const filteredCategories = useMemo(() => {
    return categories.map(category => {
      const filteredScooters = category.scooters?.filter(scooter => {
        const matchesSearch = scooter.id.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (selectedDate) {
          const selectedDateStr = selectedDate.toISOString().split('T')[0];
          const hasServiceOnDate = scooter.services?.some(
            service => service.service_date === selectedDateStr
          );
          return matchesSearch && hasServiceOnDate;
        }
        
        return matchesSearch;
      });

      return {
        ...category,
        scooters: filteredScooters
      };
    });
  }, [categories, searchTerm, selectedDate]);

  const debouncedSetSearchTerm = useDebounce((value) => {
    setSearchTerm(value);
  }, 300);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getAvailableCcTypes = (categoryName) => {
    switch (categoryName) {
      case 'Bolt':
        return [{ value: '125cc', label: '125cc (3000km interval)' }];
      case 'Private Rental':
        return [{ value: '125cc', label: '125cc (4500km interval)' }];
      case 'Sliema':
      case 'St.Lucija':
        return [
          { value: '125cc', label: '125cc (4000km interval)' },
          { value: '50cc', label: '50cc (2500km interval)' }
        ];
      default:
        return [
          { value: '125cc', label: '125cc (4000km interval)' },
          { value: '50cc', label: '50cc (2500km interval)' }
        ];
    }
  };

  return (
    <div className="min-h-screen pb-4">
      {/* Search and Filter - Sticky Header */}
      <div className="sticky top-0 z-30 bg-gray-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          {/* Search and Date Filter */}
          <div className="pt-4 pb-4">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="search"
                placeholder="Search any scooter..."
                className="w-full md:w-96 p-3 border rounded-lg shadow-sm"
                onChange={(e) => debouncedSetSearchTerm(e.target.value)}
                defaultValue={searchTerm}
              />
              <SingleDateFilter 
                onDateSelect={handleDateSelect}
                onClear={handleClearDate}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCategories.map(category => (
            <div key={category.id} className="bg-white rounded-lg shadow-sm">
              {/* Category Header - Sticky on mobile only when expanded */}
              <div 
                className={`
                  transition-all duration-300
                  ${expandedCategory === category.id ? 
                    'sticky top-[88px] bg-white z-20 shadow-sm' :
                    'relative md:sticky md:top-[88px] md:bg-white md:z-20'
                  }
                `}
              >
                <div className="p-6">
                  <div 
                    className="flex justify-between items-center cursor-pointer md:cursor-default"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <h2 className="text-xl font-bold flex items-center gap-3">
                      {category.name}
                      <ChevronDown 
                        className={`h-5 w-5 transition-transform md:hidden 
                                  ${expandedCategory === category.id ? 'rotate-180' : ''}`} 
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExportingCategory(category);
                          setShowDatePicker(true);
                        }}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50
                                rounded-lg transition-colors"
                        title="Export Service History"
                      >
                        <FileDown className="h-5 w-5" />
                      </button>
                    </h2>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategory(category.id);
                        setSelectedCategoryName(category.name);
                        setShowAddModal(true);
                      }}
                      className="bg-blue-500 text-white text-sm font-medium whitespace-nowrap
                              md:px-3 md:py-1.5 px-10 py-2.5 rounded-lg hover:bg-blue-600"
                    >
                      Add Scooter
                    </button>
                  </div>
                </div>
              </div>

{/* Scooters Stack */}
<div className={`p-6 pt-0 space-y-4 ${expandedCategory === category.id ? 'block' : 'hidden md:block'}`}>
                {category.scooters?.map(scooter => {
                  const damageStatus = getDamageAlertStatus(scooter.damages);
                  
                  return (
                    <div
                      key={scooter.id}
                      onClick={() => navigate(`/scooters/${scooter.id}`)}
                      className={`flex items-center justify-between p-4 
                               bg-gray-50 rounded-lg hover:shadow-md 
                               transition-all duration-300 cursor-pointer 
                               border ${damageStatus.hasDamage ? damageStatus.style : 'border-gray-100'}`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold">{scooter.id}</span>
                          <span className="text-sm text-gray-500">
                            ({formatCcType(scooter.cc_type, category.name)})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {scooter.status === 'active' ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                              Inactive
                            </span>
                          )}
                          {damageStatus.hasDamage && (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-sm 
                                         bg-red-100 text-red-700">
                              <AlertCircle className="h-4 w-4" />
                              {damageStatus.text}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteClick(e, scooter)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 
                                 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  );
                })}

                {(!category.scooters || category.scooters.length === 0) && (
                  <p className="text-gray-500 text-center py-4">
                    No scooters found
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Scooter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                Add New Scooter 
                {selectedCategoryName && ` - ${selectedCategoryName}`}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedCategory(null);
                  setSelectedCategoryName('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleAddScooter} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Scooter ID</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border rounded"
                  value={newScooterId}
                  onChange={(e) => setNewScooterId(e.target.value.toUpperCase())}
                  placeholder="Enter scooter ID"
                />
              </div>

              {selectedCategoryName !== 'Bolt' && selectedCategoryName !== 'Private Rental' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Engine Type</label>
                  <select
                    value={newScooterCcType}
                    onChange={(e) => setNewScooterCcType(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  >
                    {getAvailableCcTypes(selectedCategoryName).map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedCategoryName === 'Bolt' && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">
                    Bolt scooters are automatically set to 125cc BOLT type with 3000km service interval
                  </p>
                </div>
              )}

              {selectedCategoryName === 'Private Rental' && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">
                    Private Rental scooters are set to 4500km service interval
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedCategory(null);
                    setSelectedCategoryName('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Scooter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Delete Scooter</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setScooterToDelete(null);
                }}
                disabled={isDeleting}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600">
                Are you sure you want to delete scooter {scooterToDelete?.id}? This will also delete all service records and damage reports. This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setScooterToDelete(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 
                         disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Scooter</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Range Picker for Export */}
      <DateRangePicker
        isOpen={showDatePicker}
        onClose={() => {
          setShowDatePicker(false);
          setExportingCategory(null);
        }}
        onExport={handleExport}
        isLoading={isExporting}
        categoryName={exportingCategory?.name}
      />
    </div>
  );
}

export default Categories;