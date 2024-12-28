import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../../lib/supabase';
import { formatDamageDate } from '../../lib/utils';
import { StickyNote, Plus, X, Check, Trash2, AlertCircle } from 'lucide-react';

export const DamageNote = ({ scooterId }) => {  // Removed scooterCcType as it's not needed
  const [damages, setDamages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDamage, setNewDamage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [damageToDelete, setDamageToDelete] = useState(null);

  useEffect(() => {
    fetchDamages();
  }, [scooterId]);

  const fetchDamages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('damages')
        .select('*')
        .eq('scooter_id', scooterId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDamages(data || []);
    } catch (error) {
      console.error('Error fetching damages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDamage = async (e) => {
    e.preventDefault();
    if (!newDamage.trim()) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('damages')
        .insert([{
          scooter_id: scooterId,
          description: newDamage.trim(),
          resolved: false
        }]);

      if (error) throw error;

      setNewDamage('');
      setShowAddModal(false);
      await fetchDamages();
    } catch (error) {
      console.error('Error adding damage:', error);
      alert('Error adding damage report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDamage = async () => {
    if (!damageToDelete) return;
    
    try {
      setDeleting(damageToDelete.id);
      const { error } = await supabase
        .from('damages')
        .delete()
        .eq('id', damageToDelete.id);

      if (error) throw error;

      await fetchDamages();
      setShowDeleteConfirm(false);
      setDamageToDelete(null);
    } catch (error) {
      console.error('Error deleting damage:', error);
      alert('Error deleting damage report');
    } finally {
      setDeleting(null);
    }
  };

  const handleResolveDamage = async (damageId) => {
    try {
      setDeleting(damageId);
      const { error } = await supabase
        .from('damages')
        .update({ resolved: true })
        .eq('id', damageId);

      if (error) throw error;
      await fetchDamages();
    } catch (error) {
      console.error('Error resolving damage:', error);
      alert('Error resolving damage');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const unresolvedDamages = damages.filter(damage => !damage.resolved);
  const resolvedDamages = damages.filter(damage => damage.resolved);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold">Damage Reports</h3>
          {unresolvedDamages.length > 0 && (
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
              {unresolvedDamages.length} Active
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white 
                   rounded-lg hover:bg-red-600 text-sm"
        >
          <Plus className="h-4 w-4" />
          Report Damage
        </button>
      </div>

      {/* Damage List */}
      <div className="space-y-3">
        {unresolvedDamages.length === 0 && resolvedDamages.length === 0 && (
          <p className="text-center py-4 text-gray-500">
            No damage reports found
          </p>
        )}

        {/* Unresolved Damages */}
        {unresolvedDamages.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Active Reports</h4>
            {unresolvedDamages.map(damage => (
              <div
                key={damage.id}
                className="bg-red-50 border border-red-200 rounded-lg p-3 relative group"
              >
                <div className="flex justify-between items-start">
                  <div className="pr-20">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <p className="text-gray-900">{damage.description}</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Reported on: {formatDamageDate(damage.created_at)}
                    </p>
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => handleResolveDamage(damage.id)}
                      disabled={deleting === damage.id}
                      className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                      title="Mark as fixed"
                    >
                      <Check className={`h-4 w-4 ${deleting === damage.id ? 'text-gray-400' : 'text-red-600'}`} />
                    </button>
                    <button
                      onClick={() => {
                        setDamageToDelete(damage);
                        setShowDeleteConfirm(true);
                      }}
                      disabled={deleting === damage.id}
                      className="p-1.5 hover:bg-red-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete report"
                    >
                      <Trash2 className={`h-4 w-4 ${deleting === damage.id ? 'text-gray-400' : 'text-red-600'}`} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resolved Damages */}
        {resolvedDamages.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Resolved Reports</h4>
            {resolvedDamages.map(damage => (
              <div
                key={damage.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 relative group"
              >
                <div className="flex justify-between items-start">
                  <div className="pr-12">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <p className="text-gray-600">{damage.description}</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Reported on: {formatDamageDate(damage.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setDamageToDelete(damage);
                      setShowDeleteConfirm(true);
                    }}
                    disabled={deleting === damage.id}
                    className="absolute top-3 right-3 p-1.5 hover:bg-gray-200 
                             rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete report"
                  >
                    <Trash2 className={`h-4 w-4 ${deleting === damage.id ? 'text-gray-400' : 'text-gray-600'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Damage Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold">Report Damage</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleAddDamage} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Damage Description
                </label>
                <textarea
                  required
                  value={newDamage}
                  onChange={(e) => setNewDamage(e.target.value)}
                  className="w-full p-2 border rounded-lg resize-none"
                  rows={4}
                  placeholder="Describe the damage..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-500 text-white rounded-lg 
                           hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    'Submit Report'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Delete Damage Report</h2>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this damage report? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDamageToDelete(null);
                }}
                disabled={deleting}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDamage}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg 
                         hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

DamageNote.propTypes = {
  scooterId: PropTypes.string.isRequired
};

export default DamageNote;