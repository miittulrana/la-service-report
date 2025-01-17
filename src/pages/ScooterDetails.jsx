import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, AlertCircle, Trash2, Plus, X, FileDown, Pencil } from 'lucide-react';
import CustomDatePicker from '../components/ui/CustomDatePicker';
import DamageNote from '../components/ui/DamageNote';
import { calculateNextServiceKm, formatCcType } from '../lib/utils';
import ExcelImport from '../components/ui/ExcelImport';
import { Modal } from '../components/ui/Modal';
import DateRangePicker from '../components/ui/DateRangePicker';
import { generateServiceReport } from '../lib/pdfUtils';
import "react-datepicker/dist/react-datepicker.css";

function ScooterDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State management
  const [scooter, setScooter] = useState(null);
  const [services, setServices] = useState([]);
  const [damages, setDamages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddService, setShowAddService] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [showDeleteServiceModal, setShowDeleteServiceModal] = useState(false);
  const [showDeleteScooterModal, setShowDeleteScooterModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Edit service states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // New service form state
  const [newService, setNewService] = useState({
    current_km: '',
    service_details: '',
    time_taken: '',
    service_date: new Date().toISOString().split('T')[0]
  });

  // Fetch scooter details
  const fetchScooterDetails = async () => {
    try {
      setLoading(true);

      const { data: scooterData, error: scooterError } = await supabase
        .from('scooters')
        .select('*, category:categories(*)')
        .eq('id', id)
        .single();

      if (scooterError) throw scooterError;

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('scooter_id', id)
        .order('service_date', { ascending: false });

      if (servicesError) throw servicesError;

      const { data: damagesData, error: damagesError } = await supabase
        .from('damages')
        .select('*')
        .eq('scooter_id', id)
        .order('created_at', { ascending: false });

      if (damagesError) throw damagesError;

      setScooter(scooterData);
      setServices(servicesData || []);
      setDamages(damagesData || []);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScooterDetails();
  }, [id]);

  // Handle adding new service
  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      const currentKm = parseInt(newService.current_km);
      const nextKm = calculateNextServiceKm(currentKm, scooter.cc_type, scooter.category?.name);
      const { error } = await supabase
        .from('services')
        .insert([{
          scooter_id: id,
          service_date: newService.service_date,
          current_km: currentKm,
          next_km: nextKm,
          time_taken: newService.time_taken,
          service_details: newService.service_details
        }]);

      if (error) throw error;

      // Update scooter status
      await supabase
        .from('scooters')
        .update({ status: 'active' })
        .eq('id', id);

      setNewService({
        current_km: '',
        service_details: '',
        time_taken: '',
        service_date: new Date().toISOString().split('T')[0]
      });
      setShowAddService(false);
      fetchScooterDetails();
    } catch (error) {
      console.error('Error:', error);
      alert('Error adding service');
    }
  };

  // Handle editing service
  const handleEditService = async (e) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      setIsEditing(true);
      const currentKm = parseInt(editingService.current_km);
      const nextKm = calculateNextServiceKm(currentKm, scooter.cc_type);

      const { error } = await supabase
        .from('services')
        .update({
          service_date: editingService.service_date,
          current_km: currentKm,
          next_km: nextKm,
          time_taken: editingService.time_taken,
          service_details: editingService.service_details
        })
        .eq('id', editingService.id);

      if (error) throw error;

      setShowEditModal(false);
      setEditingService(null);
      fetchScooterDetails();
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating service');
    } finally {
      setIsEditing(false);
    }
  };

  // Handle deleting individual service
  const handleDeleteService = async (serviceId) => {
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
      await fetchScooterDetails();
      setShowDeleteServiceModal(false);
      setServiceToDelete(null);
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting service');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle deleting scooter
  const handleDeleteScooter = async () => {
    try {
      setIsDeleting(true);
      
      await Promise.all([
        supabase.from('services').delete().eq('scooter_id', id),
        supabase.from('damages').delete().eq('scooter_id', id)
      ]);
      
      const { error } = await supabase
        .from('scooters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting scooter');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle scooter status
  const toggleStatus = async () => {
    try {
      setUpdating(true);
      const newStatus = scooter.status === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('scooters')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setScooter(prev => ({
        ...prev,
        status: newStatus
      }));
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating status');
    } finally {
      setUpdating(false);
    }
  };

// Handle export
const handleExport = async (startDate, endDate) => {
  try {
    setIsExporting(true);

    // Add time components to make the date range inclusive
    const startDateTime = `${startDate}T00:00:00`;
    const endDateTime = `${endDate}T23:59:59`;

    // Fetch services with scooter details
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('*, scooter:scooters(id, category:categories(name))')
      .eq('scooter_id', id)
      .gte('service_date', startDate)
      .lte('service_date', endDate)
      .order('service_date', { ascending: false });

    if (servicesError) throw servicesError;

    // Fetch damages within the date range
    const { data: damagesData, error: damagesError } = await supabase
      .from('damages')
      .select('*')
      .eq('scooter_id', id)
      .gte('created_at', startDateTime)
      .lte('created_at', endDateTime)
      .order('created_at', { ascending: false });

    if (damagesError) throw damagesError;

    let combinedData = [];

    if (servicesData && servicesData.length > 0) {
      // If we have services, attach damages to them
      combinedData = servicesData.map(service => ({
        ...service,
        scooter: {
          ...service.scooter,
          damages: damagesData || []
        }
      }));
    } else if (damagesData && damagesData.length > 0) {
      // If we only have damages, create a single entry with damages
      combinedData = [{
        service_date: startDate,  // Use start date as reference
        scooter: {
          id: scooter.id,
          category: { name: scooter.category?.name },
          damages: damagesData
        }
      }];
    }

    await generateServiceReport({
      categoryName: scooter.category?.name || 'Unknown',
      dateRange: { startDate, endDate },
      services: combinedData,
      hasDamagesOnly: servicesData.length === 0 && damagesData.length > 0
    });

    setShowExportModal(false);
  } catch (error) {
    console.error('Error:', error);
    alert('Error exporting service history');
  } finally {
    setIsExporting(false);
  }
};

if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  );
}

if (error) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md w-full">
        <h2 className="text-red-600 text-lg font-semibold mb-2">Error Loading Scooter</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 hover:text-blue-700"
        >
          Return to home
        </button>
      </div>
    </div>
  );
}

if (!scooter) {
  return (
    <div className="text-center py-4">
      <p className="text-gray-600">Scooter not found</p>
      <button
        onClick={() => navigate('/')}
        className="mt-4 text-blue-600 hover:text-blue-700"
      >
        Return to home
      </button>
    </div>
  );
}

return (
  <div className="max-w-4xl mx-auto px-4 md:px-6 pt-16 md:pt-4">
    
{/* Header */}
<div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{scooter.id}</h1>
              <span className="text-lg text-gray-500">
                ({formatCcType(scooter.cc_type, scooter.category?.name)})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-gray-600 text-lg">{scooter.category?.name}</p>
              {scooter.category?.name?.toLowerCase() === 'private rental' && (
                <span className="text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  4500km interval
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowDeleteScooterModal(true)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 
                      rounded-lg transition-colors"
            title="Delete Scooter"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2 items-center">
            <span className={`px-4 py-2 rounded-lg text-sm font-medium ${
              scooter.status === 'active' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {scooter.status === 'active' ? 'Active' : 'Inactive'}
            </span>
            
            <button
              onClick={toggleStatus}
              disabled={updating}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                scooter.status === 'active'
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {updating ? 'Updating...' : scooter.status === 'active' ? 'Set Inactive' : 'Set Active'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <ExcelImport 
              scooterId={scooter.id} 
              onImportComplete={fetchScooterDetails}
            />
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg 
                       hover:bg-blue-200 transition-colors flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline">Export History</span>
            </button>
            <button
              onClick={() => setShowAddService(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                       text-sm font-medium flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Service</span>
            </button>
          </div>
        </div>
      </div>

      {/* Damage Note Section */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <DamageNote 
          scooterId={scooter.id} 
          scooterCcType={scooter.cc_type}
        />
      </div>

      {/* Service History */}
      <div className="space-y-4">
        {services.map((service) => {
          // Helper function to get interval text and KM
          const getServiceDetails = () => {
            const categoryLower = scooter.category?.name?.toLowerCase();
            if (categoryLower === 'private rental') {
              return { text: 'Private Rental', km: '4500km' };
            }
            if (categoryLower === 'bolt') {
              return { text: 'Bolt', km: '3000km' };
            }
            switch (scooter.cc_type) {
              case '125cc BOLT':
                return { text: '125cc BOLT', km: '3000km' };
              case '125cc':
                return { text: '125cc', km: '4000km' };
              case '50cc':
                return { text: '50cc', km: '2500km' };
              default:
                return { text: '125cc', km: '4000km' };
            }
          };

          const serviceDetails = getServiceDetails();

          return (
            <div key={service.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-lg">
                        {new Date(service.service_date).toLocaleDateString()}
                      </p>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {serviceDetails.text} • {serviceDetails.km}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">
                      {service.current_km.toLocaleString()} km → {service.next_km.toLocaleString()} km
                    </p>
                    {service.time_taken && (
                      <p className="text-gray-600 mt-1">
                        Time Taken: {service.time_taken}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingService({
                          ...service,
                          service_date: service.service_date
                        });
                        setShowEditModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit service"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        setServiceToDelete(service);
                        setShowDeleteServiceModal(true);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-medium text-gray-900 mb-2">Service Details:</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {service.service_details}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {services.length === 0 && (
          <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No service history found</p>
          </div>
        )}
      </div>

      {/* Add Service Modal */}
      {showAddService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Add Service for {scooter.id}</h2>
                <button
                  onClick={() => setShowAddService(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleAddService} className="p-6 space-y-4">
              <CustomDatePicker
                label="Service Date"
                date={new Date(newService.service_date)}
                onChange={(date) => setNewService(prev => ({
                  ...prev,
                  service_date: date.toISOString().split('T')[0]
                }))}
              />

              <div>
                <label className="block text-sm font-medium mb-1">Current KM</label>
                <input
                  type="number"
                  required
                  className="w-full p-2 border rounded-lg"
                  value={newService.current_km}
                  onChange={(e) => setNewService(prev => ({
                    ...prev,
                    current_km: e.target.value
                  }))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Next service will be at: {newService.current_km && (
                    parseInt(newService.current_km) + (
                      scooter.category?.name?.toLowerCase() === 'private rental' ? 4500 :
                      scooter.category?.name?.toLowerCase() === 'bolt' ? 3000 :
                      scooter.cc_type === '125cc BOLT' ? 3000 :
                      scooter.cc_type === '50cc' ? 2500 : 4000
                    )
                  ).toLocaleString()} km
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Time Taken</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={newService.time_taken}
                  onChange={(e) => setNewService(prev => ({
                    ...prev,
                    time_taken: e.target.value
                  }))}
                  placeholder="e.g. 20 min, 1 hour 30min"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Service Details</label>
                <textarea
                  required
                  className="w-full p-2 border rounded-lg"
                  rows={4}
                  value={newService.service_details}
                  placeholder="Enter service details..."
                  onChange={(e) => setNewService(prev => ({
                    ...prev,
                    service_details: e.target.value
                  }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddService(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

{/* Edit Service Modal */}
{showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Edit Service Record</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingService(null);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleEditService} className="p-6 space-y-4">
              <CustomDatePicker
                label="Service Date"
                date={new Date(editingService.service_date)}
                onChange={(date) => setEditingService(prev => ({
                  ...prev,
                  service_date: date.toISOString().split('T')[0]
                }))}
              />

              <div>
                <label className="block text-sm font-medium mb-1">Current KM</label>
                <input
                  type="number"
                  required
                  className="w-full p-2 border rounded-lg"
                  value={editingService.current_km}
                  onChange={(e) => setEditingService(prev => ({
                    ...prev,
                    current_km: e.target.value
                  }))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Next service will be at: {editingService.current_km && (
                    parseInt(editingService.current_km) + (
                      scooter.category?.name?.toLowerCase() === 'private rental' ? 4500 :
                      scooter.category?.name?.toLowerCase() === 'bolt' ? 3000 :
                      scooter.cc_type === '125cc BOLT' ? 3000 :
                      scooter.cc_type === '50cc' ? 2500 : 4000
                    )
                  ).toLocaleString()} km
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Time Taken</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={editingService.time_taken || ''}
                  onChange={(e) => setEditingService(prev => ({
                    ...prev,
                    time_taken: e.target.value
                  }))}
                  placeholder="e.g. 20 min, 1 hour 30min"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Service Details</label>
                <textarea
                  required
                  className="w-full p-2 border rounded-lg"
                  rows={4}
                  value={editingService.service_details}
                  placeholder="Enter service details..."
                  onChange={(e) => setEditingService(prev => ({
                    ...prev,
                    service_details: e.target.value
                  }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingService(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                     disabled:opacity-50 flex items-center gap-2"
                >
                  {isEditing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    'Update Service'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Service Modal */}
      <Modal
        isOpen={showDeleteServiceModal}
        onClose={() => {
          setShowDeleteServiceModal(false);
          setServiceToDelete(null);
        }}
        title="Delete Service Record"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="h-6 w-6" />
            <p className="font-medium">Warning: This action cannot be undone</p>
          </div>

          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this service record? 
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">Date: {serviceToDelete && new Date(serviceToDelete.service_date).toLocaleDateString()}</p>
              <p className="mt-1">Service Details: {serviceToDelete?.service_details}</p>
            </div>
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowDeleteServiceModal(false);
                setServiceToDelete(null);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDeleteService(serviceToDelete?.id)}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 
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
                  <span>Delete Service</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Scooter Modal */}
      <Modal
        isOpen={showDeleteScooterModal}
        onClose={() => setShowDeleteScooterModal(false)}
        title="Delete Scooter"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="h-6 w-6" />
            <p className="font-medium">Warning: This action is irreversible</p>
          </div>

          <p className="text-gray-600 mb-6">
            Are you sure you want to delete scooter {scooter.id}? This will permanently delete:
            <ul className="list-disc ml-6 mt-2">
              <li>All service records</li>
              <li>All damage reports</li>
              <li>All related data</li>
            </ul>
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteScooterModal(false)}
              disabled={isDeleting}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteScooter}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 
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
      </Modal>

      {/* Export Modal */}
      <DateRangePicker
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        isLoading={isExporting}
        categoryName={scooter.category?.name}
      />
    </div>
  );
}

export default ScooterDetails;