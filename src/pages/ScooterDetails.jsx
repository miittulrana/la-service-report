import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, AlertCircle, Trash2 } from 'lucide-react';
import CustomDatePicker from '../components/ui/CustomDatePicker';
import DamageNote from '../components/ui/DamageNote';
import { calculateNextServiceKm, formatCcType } from '../lib/utils';
import ExcelImport from '../components/ui/ExcelImport';
import { Modal } from '../components/ui/Modal';
import "react-datepicker/dist/react-datepicker.css";

function ScooterDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scooter, setScooter] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedService, setExpandedService] = useState(null);
  const [showAddService, setShowAddService] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [showDeleteServiceModal, setShowDeleteServiceModal] = useState(false);
  const [showDeleteScooterModal, setShowDeleteScooterModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newService, setNewService] = useState({
    current_km: '',
    service_details: '',
    service_date: new Date().toISOString().split('T')[0]
  });

  const fetchScooterDetails = useCallback(async () => {
    try {
      setLoading(true);
      const [scooterResponse, servicesResponse] = await Promise.all([
        supabase
          .from('scooters')
          .select('*, category:categories(*)')
          .eq('id', id)
          .single(),
        supabase
          .from('services')
          .select('*')
          .eq('scooter_id', id)
          .order('service_date', { ascending: false })
      ]);

      if (scooterResponse.error) throw scooterResponse.error;
      if (servicesResponse.error) throw servicesResponse.error;

      setScooter(scooterResponse.data);
      setServices(servicesResponse.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchScooterDetails();
  }, [fetchScooterDetails]);

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

  const handleDeleteScooter = async () => {
    try {
      setIsDeleting(true);

      await Promise.all([
        supabase
          .from('services')
          .delete()
          .eq('scooter_id', id),
        supabase
          .from('damages')
          .delete()
          .eq('scooter_id', id)
      ]);

      const { error } = await supabase
        .from('scooters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      navigate('/');
    } catch (error) {
      console.error('Error deleting scooter:', error);
      alert('Error deleting scooter');
    } finally {
      setIsDeleting(false);
    }
  };
  async function handleAddService(e) {
    e.preventDefault();
    try {
      const currentKm = parseInt(newService.current_km);
      const nextKm = calculateNextServiceKm(currentKm, scooter.cc_type);

      const { error } = await supabase
        .from('services')
        .insert([{
          scooter_id: id,
          service_date: newService.service_date,
          current_km: currentKm,
          next_km: nextKm,
          service_details: newService.service_details
        }]);

      if (error) throw error;

      await supabase
        .from('scooters')
        .update({ status: 'active' })
        .eq('id', id);

      setNewService({
        current_km: '',
        service_details: '',
        service_date: new Date().toISOString().split('T')[0]
      });
      setShowAddService(false);
      fetchScooterDetails();
    } catch (error) {
      console.error('Error:', error);
      alert('Error adding service');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
    <div className="max-w-4xl mx-auto px-4 md:px-6">
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
                ({formatCcType(scooter.cc_type)})
              </span>
            </div>
            <p className="text-gray-600 text-lg">{scooter.category?.name}</p>
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

          <div className="flex gap-2 items-center">
            <ExcelImport 
              scooterId={scooter.id} 
              onImportComplete={fetchScooterDetails}
            />
            <button
              onClick={() => setShowAddService(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                       text-sm font-medium"
            >
              Add Service
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
        {services.map((service) => (
          <div key={service.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-bold text-lg">
                    {new Date(service.service_date).toLocaleDateString()}
                  </p>
                  <p className="text-gray-600 mt-1">
                    {service.current_km.toLocaleString()} km → {service.next_km.toLocaleString()} km
                    <span className="text-sm ml-2">
                      ({scooter.cc_type})
                    </span>
                  </p>
                </div>
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

              <div className="mt-4 pt-4 border-t">
                <h3 className="font-medium text-gray-900 mb-2">Service Details:</h3>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {service.service_details}
                </p>
              </div>
            </div>
          </div>
        ))}

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
              <h2 className="text-xl font-bold">Add Service for {scooter.id}</h2>
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
                      scooter.cc_type === '125cc BOLT' ? 3000 :
                      scooter.cc_type === '50cc' ? 2500 : 4000
                    )
                  ).toLocaleString()} km
                </p>
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
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this service record? This action cannot be undone.
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
              onClick={async () => {
                try {
                  setIsDeleting(true);
                  const { error } = await supabase
                    .from('services')
                    .delete()
                    .eq('id', serviceToDelete.id);

                  if (error) throw error;

                  setShowDeleteServiceModal(false);
                  setServiceToDelete(null);
                  fetchScooterDetails();
                } catch (error) {
                  console.error('Error:', error);
                  alert('Error deleting service');
                } finally {
                  setIsDeleting(false);
                }
              }}
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
    </div>
  );
}

export default ScooterDetails;